<?php

namespace App\Actions\Inventory;

use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\SaleItemCostLayer;
use App\Models\StockLayer;
use Illuminate\Support\Facades\DB;

final class UpdateSale
{
    public function __construct(
        private RecordStockMovement $recordStockMovement,
        private SyncStockBalance $syncStockBalance,
    ) {}

    /**
     * @param  array<string, mixed>  $saleData
     * @param  array<int, array<string, mixed>>  $items
     */
    public function handle(Sale $sale, array $saleData, array $items, ?int $updatedBy = null): Sale
    {
        return DB::transaction(function () use ($sale, $saleData, $items, $updatedBy): Sale {
            $oldItems = $sale->items()->with('costLayers')->get()->keyBy('id');

            foreach ($oldItems as $oldItem) {
                $this->restoreStockForItem($oldItem, $sale, $updatedBy);
            }

            $sale->items()->delete();

            $subtotal = '0';
            $totalCogs = '0';

            foreach ($items as $itemData) {
                $variantId = (int) $itemData['product_variant_id'];
                $qty = (int) $itemData['qty'];
                $unitPrice = (string) $itemData['unit_price_usd'];
                $discount = (string) ($itemData['discount_usd'] ?? '0');
                $itemTotal = bcmul($unitPrice, (string) $qty, 4);
                $itemTotal = bcsub($itemTotal, $discount, 4);

                $saleItem = $sale->items()->create([
                    'product_variant_id' => $variantId,
                    'qty' => $qty,
                    'unit_price_usd' => $unitPrice,
                    'discount_usd' => $discount,
                    'total_usd' => $itemTotal,
                    'cogs_usd' => '0',
                    'profit_usd' => '0',
                ]);

                $cogs = $this->deductFifoStock(
                    $saleItem,
                    $variantId,
                    $qty,
                    $sale->id,
                    $updatedBy,
                );

                $profit = bcsub($itemTotal, $cogs, 4);

                $saleItem->update([
                    'cogs_usd' => $cogs,
                    'profit_usd' => $profit,
                ]);

                $subtotal = bcadd($subtotal, $itemTotal, 4);
                $totalCogs = bcadd($totalCogs, $cogs, 4);
            }

            $discount = (string) ($saleData['discount_usd'] ?? $sale->discount_usd);
            $deliveryFee = (string) ($saleData['customer_delivery_fee_usd'] ?? $sale->customer_delivery_fee_usd);
            $actualDeliveryCost = (string) ($saleData['actual_delivery_cost_usd'] ?? $sale->actual_delivery_cost_usd);
            $deliveryProfit = bcsub($deliveryFee, $actualDeliveryCost, 4);
            $total = bcadd(bcsub($subtotal, $discount, 4), $deliveryFee, 4);
            $paid = (string) ($saleData['paid_usd'] ?? $sale->paid_usd);

            $paymentStatus = 'unpaid';
            if (bccomp($paid, $total, 4) >= 0) {
                $paymentStatus = 'paid';
            } elseif (bccomp($paid, '0', 4) > 0) {
                $paymentStatus = 'partial';
            }

            $sale->update([
                'customer_name' => $saleData['customer_name'] ?? $sale->customer_name,
                'customer_phone' => $saleData['customer_phone'] ?? $sale->customer_phone,
                'customer_address' => $saleData['customer_address'] ?? $sale->customer_address,
                'source_page' => $saleData['source_page'] ?? $sale->source_page,
                'sale_date' => $saleData['sale_date'] ?? $sale->sale_date,
                'currency' => $saleData['currency'] ?? $sale->currency,
                'exchange_rate' => $saleData['exchange_rate'] ?? $sale->exchange_rate,
                'original_subtotal_usd' => $subtotal,
                'subtotal_usd' => $subtotal,
                'discount_usd' => $discount,
                'customer_delivery_fee_usd' => $deliveryFee,
                'actual_delivery_cost_usd' => $actualDeliveryCost,
                'delivery_profit_usd' => $deliveryProfit,
                'original_total_usd' => $total,
                'total_usd' => $total,
                'paid_usd' => $paid,
                'payment_status' => $paymentStatus,
                'note' => $saleData['note'] ?? $sale->note,
            ]);

            return $sale->fresh();
        });
    }

    private function restoreStockForItem(SaleItem $saleItem, Sale $sale, ?int $updatedBy): void
    {
        $totalQtyToRestore = 0;

        foreach ($saleItem->costLayers as $costLayer) {
            $layer = $costLayer->stockLayer;

            if ($layer) {
                $layer->increment('remaining_qty', $costLayer->qty);
            }

            $this->recordStockMovement->handle(
                productVariantId: $saleItem->product_variant_id,
                type: 'edit_sale',
                qtyChange: $costLayer->qty,
                stockLayerId: $costLayer->stock_layer_id,
                referenceType: $sale->getMorphClass(),
                referenceId: $sale->id,
                unitCostUsd: (string) $costLayer->unit_cost_usd,
                note: "Edit sale #{$sale->invoice_no} - restore",
                createdBy: $updatedBy,
            );

            $totalQtyToRestore += $costLayer->qty;
        }

        if ($totalQtyToRestore > 0) {
            $this->syncStockBalance->incrementOnHand(
                $saleItem->product_variant_id,
                $totalQtyToRestore,
            );
        }
    }

    private function deductFifoStock(
        SaleItem $saleItem,
        int $variantId,
        int $qtyNeeded,
        int $saleId,
        ?int $createdBy,
    ): string {
        $layers = StockLayer::where('product_variant_id', $variantId)
            ->where('remaining_qty', '>', 0)
            ->orderBy('purchase_date', 'asc')
            ->orderBy('id', 'asc')
            ->lockForUpdate()
            ->get();

        $remainingToDeduct = $qtyNeeded;
        $totalCogs = '0';

        foreach ($layers as $layer) {
            if ($remainingToDeduct <= 0) {
                break;
            }

            $deductFromLayer = min($remainingToDeduct, $layer->remaining_qty);
            $layerCost = bcmul((string) $layer->unit_cost_usd, (string) $deductFromLayer, 4);
            $totalCogs = bcadd($totalCogs, $layerCost, 4);

            $layer->decrement('remaining_qty', $deductFromLayer);

            SaleItemCostLayer::create([
                'sale_item_id' => $saleItem->id,
                'stock_layer_id' => $layer->id,
                'qty' => $deductFromLayer,
                'unit_cost_usd' => (string) $layer->unit_cost_usd,
                'total_cost_usd' => $layerCost,
            ]);

            $this->recordStockMovement->handle(
                productVariantId: $variantId,
                type: 'edit_sale',
                qtyChange: -$deductFromLayer,
                stockLayerId: $layer->id,
                referenceType: (new Sale)->getMorphClass(),
                referenceId: $saleId,
                unitCostUsd: (string) $layer->unit_cost_usd,
                note: "Edit sale #{$saleId} - deduct",
                createdBy: $createdBy,
            );

            $remainingToDeduct -= $deductFromLayer;
        }

        if ($remainingToDeduct > 0) {
            throw new \RuntimeException("Insufficient stock for variant {$variantId}. Need {$qtyNeeded}, short by {$remainingToDeduct}.");
        }

        $this->syncStockBalance->decrementOnHand($variantId, $qtyNeeded);

        return $totalCogs;
    }
}
