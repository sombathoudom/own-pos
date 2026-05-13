<?php

namespace App\Actions\Inventory;

use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\SaleItemCostLayer;
use App\Models\StockLayer;
use Illuminate\Support\Facades\DB;

final class CreateSale
{
    public function __construct(
        private RecordStockMovement $recordStockMovement,
        private SyncStockBalance $syncStockBalance,
    ) {}

    /**
     * @param  array<string, mixed>  $saleData
     * @param  array<int, array<string, mixed>>  $items
     */
    public function handle(array $saleData, array $items, ?int $createdBy = null): Sale
    {
        return DB::transaction(function () use ($saleData, $items, $createdBy): Sale {
            $sale = Sale::create([
                ...$saleData,
                'created_by' => $createdBy,
            ]);

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
                    $createdBy,
                );

                $profit = bcsub($itemTotal, $cogs, 4);

                $saleItem->update([
                    'cogs_usd' => $cogs,
                    'profit_usd' => $profit,
                ]);

                $subtotal = bcadd($subtotal, $itemTotal, 4);
                $totalCogs = bcadd($totalCogs, $cogs, 4);
            }

            $discount = (string) ($saleData['discount_usd'] ?? '0');
            $deliveryFee = (string) ($saleData['customer_delivery_fee_usd'] ?? '0');
            $actualDeliveryCost = (string) ($saleData['actual_delivery_cost_usd'] ?? '0');
            $deliveryProfit = bcsub($deliveryFee, $actualDeliveryCost, 4);
            $total = bcadd(bcsub($subtotal, $discount, 4), $deliveryFee, 4);
            $paid = (string) ($saleData['paid_usd'] ?? '0');

            $paymentStatus = 'unpaid';
            if (bccomp($paid, $total, 4) >= 0) {
                $paymentStatus = 'paid';
            } elseif (bccomp($paid, '0', 4) > 0) {
                $paymentStatus = 'partial';
            }

            $updateData = [
                'original_subtotal_usd' => $subtotal,
                'subtotal_usd' => $subtotal,
                'discount_usd' => $discount,
                'original_delivery_fee_usd' => $deliveryFee,
                'delivery_profit_usd' => $deliveryProfit,
                'original_total_usd' => $total,
                'total_usd' => $total,
                'paid_usd' => $paid,
                'payment_status' => $paymentStatus,
                'order_status' => 'confirmed',
            ];

            if ($paymentStatus === 'paid') {
                $updateData['payment_received_date'] = now()->toDateString();
            }

            $sale->update($updateData);

            return $sale->fresh();
        });
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
                type: 'sale',
                qtyChange: -$deductFromLayer,
                stockLayerId: $layer->id,
                referenceType: (new Sale)->getMorphClass(),
                referenceId: $saleId,
                unitCostUsd: (string) $layer->unit_cost_usd,
                note: "Sale #{$saleId}",
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
