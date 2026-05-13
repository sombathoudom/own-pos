<?php

namespace App\Actions\Inventory;

use App\Models\ProductVariant;
use App\Models\Sale;
use App\Models\SaleExchange;
use App\Models\SaleExchangeItem;
use App\Models\SaleItem;
use App\Models\SaleItemCostLayer;
use App\Models\StockLayer;
use Illuminate\Support\Facades\DB;

final class ExchangeSale
{
    public function __construct(
        private RecordStockMovement $recordStockMovement,
        private SyncStockBalance $syncStockBalance,
    ) {}

    /**
     * @param  array<int, array<string, mixed>>  $exchangeItems  Each item: ['sale_item_id' => int, 'qty' => int, 'new_variant_id' => int, 'new_unit_price' => string]
     * @param  array<int, array<string, mixed>>  $newItems  Each item: ['product_variant_id' => int, 'qty' => int, 'unit_price_usd' => string]
     */
    public function handle(
        Sale $sale,
        array $exchangeItems,
        array $newItems = [],
        string $exchangeDeliveryFeeUsd = '0',
        string $exchangeDeliveryCostUsd = '0',
        ?string $exchangeDate = null,
        ?string $note = null,
        ?int $createdBy = null,
    ): void {
        DB::transaction(function () use ($sale, $exchangeItems, $newItems, $exchangeDeliveryFeeUsd, $exchangeDeliveryCostUsd, $exchangeDate, $note, $createdBy): void {
            if ($sale->isCancelled()) {
                throw new \RuntimeException('Cannot exchange a cancelled sale.');
            }

            if (! $sale->isDeliveryCompleted()) {
                throw new \RuntimeException('Use delivery confirmation before using exchange. Exchanges are only allowed after delivery is completed.');
            }

            $exchangeRecordedDate = $exchangeDate ?? now()->toDateString();

            $saleExchange = SaleExchange::create([
                'sale_id' => $sale->id,
                'exchange_date' => $exchangeRecordedDate,
                'exchange_delivery_fee_usd' => $exchangeDeliveryFeeUsd,
                'exchange_delivery_cost_usd' => $exchangeDeliveryCostUsd,
                'note' => $note,
                'created_by' => $createdBy,
            ]);

            $exchangeSubtotalAdjustment = '0';
            $exchangeCogsAdjustment = '0';
            $processedExchangeCount = 0;
            $processedNewItemCount = 0;

            foreach ($exchangeItems as $itemData) {
                $saleItem = $sale->items()->find($itemData['sale_item_id']);
                if (! $saleItem) {
                    continue;
                }

                $exchangeQty = (int) $itemData['qty'];
                if ($exchangeQty <= 0) {
                    continue;
                }

                $alreadyReturned = $sale->returns()
                    ->with('items')
                    ->get()
                    ->flatMap(fn ($r) => $r->items->where('sale_item_id', $saleItem->id))
                    ->sum('qty');

                $alreadyExchanged = $sale->exchanges()
                    ->with('items')
                    ->get()
                    ->flatMap(fn ($e) => $e->items->where('sale_item_id', $saleItem->id))
                    ->sum('qty_returned');

                $exchangeableQty = $saleItem->final_qty > 0 ? $saleItem->final_qty : $saleItem->qty;
                $maxExchange = $exchangeableQty - $alreadyReturned - $alreadyExchanged;
                if ($exchangeQty > $maxExchange) {
                    throw new \RuntimeException(
                        "Cannot exchange {$exchangeQty} of item #{$saleItem->id}. Max exchangeable: {$maxExchange}."
                    );
                }

                $newVariantId = (int) $itemData['new_variant_id'];
                $newUnitPrice = (string) $itemData['new_unit_price'];
                $newVariant = ProductVariant::find($newVariantId);

                if (! $newVariant) {
                    throw new \RuntimeException("Variant #{$newVariantId} not found.");
                }

                $restoredCogs = $this->exchangeOut($saleItem, $exchangeQty, $sale, $createdBy);
                $newSaleItem = $this->exchangeIn($saleItem, $exchangeQty, $newVariant, $newUnitPrice, $sale, $createdBy);
                $this->refreshOriginalSaleItemAfterExchange($saleItem, $exchangeQty);

                SaleExchangeItem::create([
                    'sale_exchange_id' => $saleExchange->id,
                    'sale_item_id' => $saleItem->id,
                    'qty_returned' => $exchangeQty,
                    'new_variant_id' => $newVariantId,
                    'new_unit_price_usd' => $newUnitPrice,
                    'new_sale_item_id' => $newSaleItem->id,
                ]);

                $oldUnitPrice = (string) $saleItem->unit_price_usd;
                $oldItemTotal = bcmul($oldUnitPrice, (string) $exchangeQty, 4);
                $newItemTotal = bcmul($newUnitPrice, (string) $exchangeQty, 4);
                $priceDiff = bcsub($newItemTotal, $oldItemTotal, 4);
                $exchangeSubtotalAdjustment = bcadd($exchangeSubtotalAdjustment, $priceDiff, 4);
                $exchangeCogsAdjustment = bcadd(
                    $exchangeCogsAdjustment,
                    bcsub((string) $newSaleItem->cogs_usd, $restoredCogs, 4),
                    4,
                );
                $processedExchangeCount++;
            }

            $newItemsSubtotal = '0';
            $newItemsCogs = '0';
            $additionalQtySold = 0;
            foreach ($newItems as $itemData) {
                $variantId = (int) $itemData['product_variant_id'];
                $qty = (int) $itemData['qty'];
                $unitPrice = (string) $itemData['unit_price_usd'];
                $variant = ProductVariant::find($variantId);

                if (! $variant) {
                    throw new \RuntimeException("Variant #{$variantId} not found.");
                }

                $itemTotal = bcmul($unitPrice, (string) $qty, 4);

                $newSaleItem = $sale->items()->create([
                    'product_variant_id' => $variantId,
                    'status' => 'accepted',
                    'qty' => $qty,
                    'accepted_qty' => $qty,
                    'rejected_qty' => 0,
                    'final_qty' => $qty,
                    'unit_price_usd' => $unitPrice,
                    'discount_usd' => '0',
                    'total_usd' => $itemTotal,
                    'cogs_usd' => '0',
                    'profit_usd' => '0',
                ]);

                $cogs = $this->deductFifoStock($newSaleItem, $variantId, $qty, $sale->id, $createdBy);
                $profit = bcsub($itemTotal, $cogs, 4);

                $newSaleItem->update([
                    'cogs_usd' => $cogs,
                    'profit_usd' => $profit,
                ]);

                $this->syncStockBalance->decrementOnHand($variantId, $qty);
                $newItemsSubtotal = bcadd($newItemsSubtotal, $itemTotal, 4);
                $newItemsCogs = bcadd($newItemsCogs, $cogs, 4);
                $additionalQtySold += $qty;
                $processedNewItemCount++;
            }

            if ($processedExchangeCount === 0 && $processedNewItemCount === 0 && bccomp($exchangeDeliveryFeeUsd, '0', 4) <= 0) {
                throw new \RuntimeException('Exchange must include a changed item, extra item, or extra delivery fee.');
            }

            $currentSubtotal = (string) $sale->subtotal_usd;
            $currentDeliveryFee = (string) $sale->customer_delivery_fee_usd;
            $currentActualCost = (string) $sale->actual_delivery_cost_usd;
            $currentDiscount = (string) $sale->discount_usd;

            $newSubtotal = bcadd(bcadd($currentSubtotal, $exchangeSubtotalAdjustment, 4), $newItemsSubtotal, 4);
            $newDeliveryFee = bcadd($currentDeliveryFee, $exchangeDeliveryFeeUsd, 4);
            $newActualCost = bcadd($currentActualCost, $exchangeDeliveryCostUsd, 4);
            $newDeliveryProfit = bcsub($newDeliveryFee, $newActualCost, 4);
            $newTotal = bcadd(bcsub($newSubtotal, $currentDiscount, 4), $newDeliveryFee, 4);
            $additionalAmount = bcadd(
                bcadd($exchangeSubtotalAdjustment, $newItemsSubtotal, 4),
                $exchangeDeliveryFeeUsd,
                4,
            );
            $additionalCogs = bcadd($exchangeCogsAdjustment, $newItemsCogs, 4);
            $additionalProfit = bcsub(
                bcsub($additionalAmount, $additionalCogs, 4),
                $exchangeDeliveryCostUsd,
                4,
            );

            $saleExchange->update([
                'payment_received_date' => bccomp($additionalAmount, '0', 4) > 0 ? $exchangeRecordedDate : null,
                'subtotal_adjustment_usd' => $exchangeSubtotalAdjustment,
                'new_items_subtotal_usd' => $newItemsSubtotal,
                'total_additional_amount_usd' => $additionalAmount,
                'additional_cogs_usd' => $additionalCogs,
                'additional_profit_usd' => $additionalProfit,
                'additional_qty_sold' => $additionalQtySold,
            ]);

            $newPaidUsd = bcadd((string) $sale->paid_usd, $additionalAmount, 4);
            $paymentStatus = 'unpaid';
            if (bccomp($newPaidUsd, $newTotal, 4) >= 0) {
                $paymentStatus = 'paid';
            } elseif (bccomp($newPaidUsd, '0', 4) > 0) {
                $paymentStatus = 'partial';
            }

            $sale->update([
                'subtotal_usd' => $newSubtotal,
                'customer_delivery_fee_usd' => $newDeliveryFee,
                'actual_delivery_cost_usd' => $newActualCost,
                'delivery_profit_usd' => $newDeliveryProfit,
                'total_usd' => $newTotal,
                'paid_usd' => $newPaidUsd,
                'payment_status' => $paymentStatus,
            ]);
        });
    }

    private function exchangeOut(SaleItem $saleItem, int $qty, Sale $sale, ?int $createdBy): string
    {
        $remainingToRestore = $qty;
        $restoredCogs = '0';

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

            $restoredCogs = bcadd(
                $restoredCogs,
                bcmul((string) $costLayer->unit_cost_usd, (string) $restoreQty, 4),
                4,
            );

            $this->recordStockMovement->handle(
                productVariantId: $saleItem->product_variant_id,
                type: 'exchange_in',
                qtyChange: $restoreQty,
                stockLayerId: $costLayer->stock_layer_id,
                referenceType: $sale->getMorphClass(),
                referenceId: $sale->id,
                unitCostUsd: (string) $costLayer->unit_cost_usd,
                note: "Exchange out for sale #{$sale->invoice_no}",
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
            throw new \RuntimeException("Unable to restore {$qty} units for exchange from sale item #{$saleItem->id}.");
        }

        $this->syncStockBalance->incrementOnHand($saleItem->product_variant_id, $qty);

        return $restoredCogs;
    }

    private function refreshOriginalSaleItemAfterExchange(SaleItem $saleItem, int $exchangeQty): void
    {
        $currentFinalQty = $saleItem->final_qty > 0 ? $saleItem->final_qty : $saleItem->qty;
        $newFinalQty = max(0, $currentFinalQty - $exchangeQty);
        $currentLineTotal = (string) $saleItem->total_usd;
        $lineUnitValue = $currentFinalQty > 0
            ? bcdiv($currentLineTotal, (string) $currentFinalQty, 4)
            : '0';
        $newLineTotal = bcmul($lineUnitValue, (string) $newFinalQty, 4);
        $remainingCogs = (string) $saleItem->costLayers()->sum('total_cost_usd');
        $profit = bcsub($newLineTotal, $remainingCogs, 4);

        $saleItem->update([
            'status' => $newFinalQty === 0 ? 'exchanged' : 'partially_exchanged',
            'accepted_qty' => $newFinalQty,
            'rejected_qty' => $saleItem->rejected_qty + $exchangeQty,
            'final_qty' => $newFinalQty,
            'total_usd' => $newLineTotal,
            'cogs_usd' => $remainingCogs,
            'profit_usd' => $profit,
        ]);
    }

    private function exchangeIn(SaleItem $saleItem, int $qty, ProductVariant $newVariant, string $unitPrice, Sale $sale, ?int $createdBy): SaleItem
    {
        $itemTotal = bcmul($unitPrice, (string) $qty, 4);

        $newSaleItem = $sale->items()->create([
            'product_variant_id' => $newVariant->id,
            'status' => 'accepted',
            'qty' => $qty,
            'accepted_qty' => $qty,
            'rejected_qty' => 0,
            'final_qty' => $qty,
            'unit_price_usd' => $unitPrice,
            'discount_usd' => '0',
            'total_usd' => $itemTotal,
            'cogs_usd' => '0',
            'profit_usd' => '0',
        ]);

        $cogs = $this->deductFifoStock($newSaleItem, $newVariant->id, $qty, $sale->id, $createdBy);
        $profit = bcsub($itemTotal, $cogs, 4);

        $newSaleItem->update([
            'cogs_usd' => $cogs,
            'profit_usd' => $profit,
        ]);

        $this->syncStockBalance->decrementOnHand($newVariant->id, $qty);

        return $newSaleItem;
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
                type: 'exchange_out',
                qtyChange: -$deductFromLayer,
                stockLayerId: $layer->id,
                referenceType: (new Sale)->getMorphClass(),
                referenceId: $saleId,
                unitCostUsd: (string) $layer->unit_cost_usd,
                note: "Exchange in for sale #{$saleId}",
                createdBy: $createdBy,
            );

            $remainingToDeduct -= $deductFromLayer;
        }

        if ($remainingToDeduct > 0) {
            throw new \RuntimeException("Insufficient stock for variant {$variantId}. Need {$qtyNeeded}, short by {$remainingToDeduct}.");
        }

        return $totalCogs;
    }
}
