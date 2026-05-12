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

                $alreadyReturned = $sale->returns()
                    ->with('items')
                    ->get()
                    ->flatMap(fn ($r) => $r->items->where('sale_item_id', $saleItem->id))
                    ->sum('qty');

                $maxReturn = $saleItem->qty - $alreadyReturned;
                if ($returnQty > $maxReturn) {
                    throw new \RuntimeException(
                        "Cannot return {$returnQty} of item #{$saleItem->id}. Max returnable: {$maxReturn}."
                    );
                }

                $refund = bcmul((string) $saleItem->unit_price_usd, (string) $returnQty, 4);
                $cogs = bcmul((string) $saleItem->cogs_usd, bcdiv((string) $returnQty, (string) $saleItem->qty, 4), 4);

                $saleReturn->items()->create([
                    'sale_item_id' => $saleItem->id,
                    'product_variant_id' => $saleItem->product_variant_id,
                    'qty' => $returnQty,
                    'unit_price_usd' => $saleItem->unit_price_usd,
                    'refund_usd' => $refund,
                    'cogs_usd' => $cogs,
                ]);

                $this->restoreStock($saleItem, $returnQty, $saleReturn, $createdBy);

                $totalRefund = bcadd($totalRefund, $refund, 4);
            }

            $saleReturn->update(['total_refund_usd' => $totalRefund]);

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

            $remainingToRestore -= $restoreQty;
        }

        $this->syncStockBalance->incrementOnHand($saleItem->product_variant_id, $returnQty);
    }

    private function updateSaleStatus(Sale $sale): void
    {
        $totalSold = $sale->items->sum('qty');
        $totalReturned = $sale->returns->flatMap(fn ($r) => $r->items)->sum('qty');

        if ($totalReturned >= $totalSold) {
            $sale->update(['order_status' => 'returned']);
        } else {
            $sale->update(['order_status' => 'partially_returned']);
        }
    }
}
