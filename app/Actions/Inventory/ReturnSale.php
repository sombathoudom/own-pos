<?php

namespace App\Actions\Inventory;

use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\SaleReturn;
use Illuminate\Support\Facades\DB;

final class ReturnSale
{
    public function __construct(
        private RecordStockMovement $recordStockMovement,
        private SyncStockBalance $syncStockBalance,
    ) {}

    /**
     * @param  array<int, array<string, mixed>>  $items  Each item: ['sale_item_id' => int, 'qty' => int]
     */
    public function handle(Sale $sale, array $items, string $returnedAt, ?string $note = null, ?int $createdBy = null): SaleReturn
    {
        return DB::transaction(function () use ($sale, $items, $returnedAt, $note, $createdBy): SaleReturn {
            if ($sale->isCancelled()) {
                throw new \RuntimeException('Cannot return a cancelled sale.');
            }

            if (! $sale->isDeliveryCompleted()) {
                throw new \RuntimeException('Use delivery confirmation before using sale return. Returns are only allowed after delivery is completed.');
            }

            $saleReturn = SaleReturn::create([
                'sale_id' => $sale->id,
                'returned_at' => $returnedAt,
                'note' => $note,
                'created_by' => $createdBy,
            ]);

            $totalRefund = '0';

            foreach ($items as $itemData) {
                $saleItem = $sale->items()->find($itemData['sale_item_id']);
                if (! $saleItem) {
                    continue;
                }

                $returnQty = (int) $itemData['qty'];
                if ($returnQty <= 0) {
                    continue;
                }

                $returnableQty = max(0, $saleItem->final_qty > 0 ? $saleItem->final_qty : $saleItem->qty);
                $maxReturn = $returnableQty;
                if ($returnQty > $maxReturn) {
                    throw new \RuntimeException(
                        "Cannot return {$returnQty} of item #{$saleItem->id}. Max returnable: {$maxReturn}."
                    );
                }

                $refundBaseQty = max(1, $returnableQty);
                $refund = bcmul((string) $saleItem->total_usd, bcdiv((string) $returnQty, (string) $refundBaseQty, 4), 4);
                $cogs = bcmul((string) $saleItem->cogs_usd, bcdiv((string) $returnQty, (string) $refundBaseQty, 4), 4);

                $saleReturn->items()->create([
                    'sale_item_id' => $saleItem->id,
                    'product_variant_id' => $saleItem->product_variant_id,
                    'qty' => $returnQty,
                    'unit_price_usd' => $saleItem->unit_price_usd,
                    'refund_usd' => $refund,
                    'cogs_usd' => $cogs,
                ]);

                $this->restoreStock($saleItem, $returnQty, $saleReturn, $createdBy);
                $this->refreshSaleItemAfterReturn($saleItem, $returnQty);

                $totalRefund = bcadd($totalRefund, $refund, 4);
            }

            $saleReturn->update([
                'total_refund_usd' => $totalRefund,
                'payment_received_date' => $returnedAt,
            ]);

            $newTotalUsd = bcsub((string) $sale->total_usd, $totalRefund, 4);
            $newSubtotalUsd = bcsub((string) $sale->subtotal_usd, $totalRefund, 4);
            $newPaidUsd = bcsub((string) $sale->paid_usd, $totalRefund, 4);

            $paymentStatus = 'unpaid';
            if (bccomp($newPaidUsd, '0', 4) < 0) {
                $newPaidUsd = '0';
            }
            if (bccomp($newPaidUsd, $newTotalUsd, 4) >= 0) {
                $paymentStatus = 'paid';
            } elseif (bccomp($newPaidUsd, '0', 4) > 0) {
                $paymentStatus = 'partial';
            }

            $sale->update([
                'total_usd' => $newTotalUsd,
                'subtotal_usd' => $newSubtotalUsd,
                'paid_usd' => $newPaidUsd,
                'payment_status' => $paymentStatus,
            ]);

            $this->updateSaleStatus($sale);

            return $saleReturn->fresh();
        });
    }

    private function restoreStock(SaleItem $saleItem, int $returnQty, SaleReturn $saleReturn, ?int $createdBy): void
    {
        $remainingToRestore = $returnQty;

        $costLayers = $saleItem->costLayers()->orderByDesc('id')->get();

        foreach ($costLayers as $costLayer) {
            if ($remainingToRestore <= 0) {
                break;
            }

            $restoreQty = min($remainingToRestore, $costLayer->qty);

            $layer = $costLayer->stockLayer;
            if ($layer) {
                $layer->increment('remaining_qty', $restoreQty);
            }

            $this->recordStockMovement->handle(
                productVariantId: $saleItem->product_variant_id,
                type: 'sale_return',
                qtyChange: $restoreQty,
                stockLayerId: $costLayer->stock_layer_id,
                referenceType: $saleReturn->getMorphClass(),
                referenceId: $saleReturn->id,
                unitCostUsd: (string) $costLayer->unit_cost_usd,
                note: "Return for sale #{$saleItem->sale->invoice_no}",
                createdBy: $createdBy,
            );

            $remainingLayerQty = $costLayer->qty - $restoreQty;

            if ($remainingLayerQty > 0) {
                $costLayer->update([
                    'qty' => $remainingLayerQty,
                    'total_cost_usd' => bcmul((string) $costLayer->unit_cost_usd, (string) $remainingLayerQty, 4),
                ]);
            } else {
                $costLayer->delete();
            }

            $remainingToRestore -= $restoreQty;
        }

        if ($remainingToRestore > 0) {
            throw new \RuntimeException("Unable to restore {$returnQty} returned units for sale item #{$saleItem->id}.");
        }

        $this->syncStockBalance->incrementOnHand($saleItem->product_variant_id, $returnQty);
    }

    private function updateSaleStatus(Sale $sale): void
    {
        $sale->load('items', 'returns.items');
        $totalRemaining = $sale->items->sum('final_qty');
        $totalReturned = $sale->returns->flatMap(fn ($r) => $r->items)->sum('qty');

        if ($totalRemaining === 0 && $totalReturned > 0) {
            $sale->update(['order_status' => 'returned']);
        } elseif ($totalReturned > 0) {
            $sale->update(['order_status' => 'partially_returned']);
        }
    }

    private function refreshSaleItemAfterReturn(SaleItem $saleItem, int $returnQty): void
    {
        $saleItem->refresh();
        $currentFinalQty = $saleItem->final_qty > 0 ? $saleItem->final_qty : $saleItem->qty;
        $newFinalQty = max(0, $currentFinalQty - $returnQty);
        $currentLineTotal = (string) $saleItem->total_usd;
        $lineUnitValue = $currentFinalQty > 0
            ? bcdiv($currentLineTotal, (string) $currentFinalQty, 4)
            : '0';
        $newLineTotal = bcmul($lineUnitValue, (string) $newFinalQty, 4);
        $remainingCogs = (string) $saleItem->costLayers()->sum('total_cost_usd');
        $profit = bcsub($newLineTotal, $remainingCogs, 4);

        $saleItem->update([
            'final_qty' => $newFinalQty,
            'total_usd' => $newLineTotal,
            'cogs_usd' => $remainingCogs,
            'profit_usd' => $profit,
        ]);
    }
}
