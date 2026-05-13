<?php

namespace App\Actions\Inventory;

use App\Models\DeliveryConfirmation;
use App\Models\ProductVariant;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\SaleItemCostLayer;
use App\Models\StockLayer;
use Illuminate\Support\Facades\DB;

final class ConfirmSaleDelivery
{
    public function __construct(
        private RecordStockMovement $recordStockMovement,
        private SyncStockBalance $syncStockBalance,
    ) {}

    /**
     * @param  array<int, array<string, mixed>>  $items
     * @param  array<int, array<string, mixed>>  $addedItems
     */
    public function handle(
        Sale $sale,
        string $confirmationDate,
        string $status,
        array $items,
        array $addedItems,
        string $finalDeliveryFeeUsd,
        string $actualDeliveryCostUsd,
        ?string $deliveryFeeNote = null,
        ?string $note = null,
        ?int $confirmedBy = null,
    ): DeliveryConfirmation {
        return DB::transaction(function () use (
            $sale,
            $confirmationDate,
            $status,
            $items,
            $addedItems,
            $finalDeliveryFeeUsd,
            $actualDeliveryCostUsd,
            $deliveryFeeNote,
            $note,
            $confirmedBy,
        ): DeliveryConfirmation {
            if ($sale->isCancelled()) {
                throw new \RuntimeException('Cannot confirm delivery for a cancelled sale.');
            }

            if ($sale->isDeliveryCompleted()) {
                throw new \RuntimeException('Delivery has already been confirmed for this sale.');
            }

            if ($sale->deliveryConfirmations()->exists()) {
                throw new \RuntimeException('Delivery confirmation already exists for this sale.');
            }

            $sale->loadMissing('items.costLayers.stockLayer', 'delivery');

            $saleItems = $sale->items->keyBy('id');
            $itemsBySaleItemId = collect($items)->keyBy(fn (array $item): int => (int) $item['sale_item_id']);

            $deliveryConfirmation = DeliveryConfirmation::create([
                'sale_id' => $sale->id,
                'confirmation_date' => $confirmationDate,
                'original_product_total_usd' => (string) $sale->subtotal_usd,
                'final_product_total_usd' => '0',
                'original_delivery_fee_usd' => (string) $sale->customer_delivery_fee_usd,
                'final_delivery_fee_usd' => $finalDeliveryFeeUsd,
                'discount_usd' => (string) $sale->discount_usd,
                'final_total_usd' => '0',
                'delivery_fee_note' => $deliveryFeeNote,
                'status' => $status,
                'note' => $note,
                'confirmed_by' => $confirmedBy,
            ]);

            foreach ($saleItems as $saleItem) {
                $itemData = $itemsBySaleItemId->get($saleItem->id);

                if (! $itemData) {
                    throw new \RuntimeException("Delivery confirmation data is missing for sale item #{$saleItem->id}.");
                }

                $acceptedQty = (int) $itemData['accepted_qty'];
                $changedQty = (int) ($itemData['changed_qty'] ?? 0);
                $originalQty = (int) $saleItem->qty;

                if ($acceptedQty < 0 || $changedQty < 0) {
                    throw new \RuntimeException('Accepted and changed quantities must be zero or greater.');
                }

                if (($acceptedQty + $changedQty) > $originalQty) {
                    throw new \RuntimeException("Accepted and changed quantities exceed original quantity for item #{$saleItem->id}.");
                }

                $rejectedQty = $originalQty - $acceptedQty - $changedQty;

                if ($rejectedQty > 0) {
                    $movementType = $acceptedQty === 0 && $changedQty === 0
                        ? 'delivery_cancel_return'
                        : 'delivery_rejected_return';

                    $this->restoreSaleItemQuantity($saleItem, $rejectedQty, $movementType, $sale, $confirmedBy);
                }

                if ($changedQty > 0) {
                    $this->restoreSaleItemQuantity($saleItem, $changedQty, 'delivery_change_in', $sale, $confirmedBy);

                    $newVariantId = (int) ($itemData['new_variant_id'] ?? 0);
                    $newUnitPrice = (string) ($itemData['new_unit_price'] ?? '0');
                    $newVariant = ProductVariant::find($newVariantId);

                    if (! $newVariant) {
                        throw new \RuntimeException("Replacement variant #{$newVariantId} not found.");
                    }

                    $replacementSaleItem = $this->createSaleItemFromVariant(
                        sale: $sale,
                        variant: $newVariant,
                        qty: $changedQty,
                        unitPrice: $newUnitPrice,
                        status: 'accepted',
                        movementType: 'delivery_change_out',
                        noteLabel: "Delivery change for sale #{$sale->invoice_no}",
                        createdBy: $confirmedBy,
                    );

                    $deliveryConfirmation->items()->create([
                        'sale_item_id' => $saleItem->id,
                        'original_product_variant_id' => $saleItem->product_variant_id,
                        'final_product_variant_id' => $replacementSaleItem->product_variant_id,
                        'original_qty' => $originalQty,
                        'accepted_qty' => $changedQty,
                        'rejected_qty' => 0,
                        'added_qty' => 0,
                        'unit_price_usd' => $replacementSaleItem->unit_price_usd,
                        'final_total_usd' => $replacementSaleItem->total_usd,
                        'action_type' => 'changed',
                        'return_to_stock' => true,
                        'condition' => 'good',
                        'note' => $itemData['note'] ?? null,
                    ]);
                }

                $this->refreshOriginalSaleItem($saleItem, $acceptedQty, $changedQty, $rejectedQty);

                $deliveryConfirmation->items()->create([
                    'sale_item_id' => $saleItem->id,
                    'original_product_variant_id' => $saleItem->product_variant_id,
                    'final_product_variant_id' => $saleItem->product_variant_id,
                    'original_qty' => $originalQty,
                    'accepted_qty' => $acceptedQty,
                    'rejected_qty' => $rejectedQty,
                    'added_qty' => 0,
                    'unit_price_usd' => $saleItem->unit_price_usd,
                    'final_total_usd' => $saleItem->total_usd,
                    'action_type' => $this->determineActionType($acceptedQty, $changedQty, $rejectedQty, $originalQty),
                    'return_to_stock' => $rejectedQty > 0 || $changedQty > 0,
                    'condition' => 'good',
                    'note' => $itemData['note'] ?? null,
                ]);
            }

            foreach ($addedItems as $itemData) {
                $variantId = (int) $itemData['product_variant_id'];
                $qty = (int) $itemData['qty'];
                $unitPrice = (string) $itemData['unit_price_usd'];
                $variant = ProductVariant::find($variantId);

                if (! $variant) {
                    throw new \RuntimeException("Added item variant #{$variantId} not found.");
                }

                $newSaleItem = $this->createSaleItemFromVariant(
                    sale: $sale,
                    variant: $variant,
                    qty: $qty,
                    unitPrice: $unitPrice,
                    status: 'accepted',
                    movementType: 'delivery_added_item',
                    noteLabel: "Delivery added item for sale #{$sale->invoice_no}",
                    createdBy: $confirmedBy,
                );

                $deliveryConfirmation->items()->create([
                    'sale_item_id' => $newSaleItem->id,
                    'original_product_variant_id' => null,
                    'final_product_variant_id' => $newSaleItem->product_variant_id,
                    'original_qty' => 0,
                    'accepted_qty' => $qty,
                    'rejected_qty' => 0,
                    'added_qty' => $qty,
                    'unit_price_usd' => $newSaleItem->unit_price_usd,
                    'final_total_usd' => $newSaleItem->total_usd,
                    'action_type' => 'added',
                    'return_to_stock' => false,
                    'condition' => 'good',
                    'note' => $itemData['note'] ?? null,
                ]);
            }

            $sale->load('items');

            $finalSubtotal = (string) $sale->items()->sum('total_usd');
            $finalTotal = bcadd(bcsub($finalSubtotal, (string) $sale->discount_usd, 4), $finalDeliveryFeeUsd, 4);
            $deliveryProfit = bcsub($finalDeliveryFeeUsd, $actualDeliveryCostUsd, 4);
            $deliveryStatus = $this->mapDeliveryStatus($status, $finalSubtotal);
            $isSuccessfulDelivery = in_array($deliveryStatus, ['delivered', 'partially_delivered'], true);

            $paidUsd = $isSuccessfulDelivery ? $finalTotal : '0.0000';
            $paymentStatus = 'unpaid';
            if ($isSuccessfulDelivery && bccomp($paidUsd, $finalTotal, 4) >= 0) {
                $paymentStatus = 'paid';
            } elseif (bccomp($paidUsd, '0', 4) > 0) {
                $paymentStatus = 'partial';
            }

            $saleUpdateData = [
                'subtotal_usd' => $finalSubtotal,
                'customer_delivery_fee_usd' => $finalDeliveryFeeUsd,
                'actual_delivery_cost_usd' => $actualDeliveryCostUsd,
                'delivery_profit_usd' => $deliveryProfit,
                'total_usd' => $finalTotal,
                'paid_usd' => $paidUsd,
                'payment_status' => $paymentStatus,
                'order_status' => $this->mapSaleOrderStatus($status, $finalSubtotal),
                'delivery_completed_date' => $confirmationDate,
            ];

            if ($isSuccessfulDelivery) {
                $saleUpdateData['payment_received_date'] = $confirmationDate;
            } elseif ($paymentStatus === 'paid' && ! $sale->payment_received_date) {
                $saleUpdateData['payment_received_date'] = $confirmationDate;
            }

            $sale->update($saleUpdateData);

            $sale->delivery()->updateOrCreate(
                ['sale_id' => $sale->id],
                [
                    'customer_delivery_fee_usd' => $finalDeliveryFeeUsd,
                    'actual_delivery_cost_usd' => $actualDeliveryCostUsd,
                    'delivery_profit_usd' => $deliveryProfit,
                    'delivery_status' => $deliveryStatus,
                    'delivered_at' => $deliveryStatus === 'failed' ? null : $confirmationDate,
                    'failed_reason' => $deliveryStatus === 'failed' ? $note : null,
                    'note' => $note,
                ],
            );

            $deliveryConfirmation->update([
                'final_product_total_usd' => $finalSubtotal,
                'final_total_usd' => $finalTotal,
            ]);

            return $deliveryConfirmation->fresh('items');
        });
    }

    private function restoreSaleItemQuantity(
        SaleItem $saleItem,
        int $qty,
        string $movementType,
        Sale $sale,
        ?int $createdBy,
    ): void {
        $remainingToRestore = $qty;

        $costLayers = $saleItem->costLayers()
            ->with('stockLayer')
            ->orderByDesc('id')
            ->lockForUpdate()
            ->get();

        foreach ($costLayers as $costLayer) {
            if ($remainingToRestore <= 0) {
                break;
            }

            $restoreQty = min($remainingToRestore, $costLayer->qty);

            if ($costLayer->stockLayer) {
                $costLayer->stockLayer->increment('remaining_qty', $restoreQty);
            }

            $this->recordStockMovement->handle(
                productVariantId: $saleItem->product_variant_id,
                type: $movementType,
                qtyChange: $restoreQty,
                stockLayerId: $costLayer->stock_layer_id,
                referenceType: $sale->getMorphClass(),
                referenceId: $sale->id,
                unitCostUsd: (string) $costLayer->unit_cost_usd,
                note: "Delivery confirmation for sale #{$sale->invoice_no}",
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
            throw new \RuntimeException("Unable to restore {$qty} units for sale item #{$saleItem->id}.");
        }

        $this->syncStockBalance->incrementOnHand($saleItem->product_variant_id, $qty);
    }

    private function refreshOriginalSaleItem(SaleItem $saleItem, int $acceptedQty, int $changedQty, int $rejectedQty): void
    {
        $remainingCogs = (string) $saleItem->costLayers()->sum('total_cost_usd');
        $finalQty = $acceptedQty;
        $discount = $this->proRateAmount((string) $saleItem->discount_usd, $finalQty, (int) $saleItem->qty);
        $lineSubtotal = bcmul((string) $saleItem->unit_price_usd, (string) $finalQty, 4);
        $lineTotal = bcsub($lineSubtotal, $discount, 4);
        $profit = bcsub($lineTotal, $remainingCogs, 4);

        $status = match (true) {
            $changedQty > 0 => 'changed',
            $finalQty === 0 && $rejectedQty > 0 => 'rejected',
            $rejectedQty > 0 => 'partially_accepted',
            default => 'accepted',
        };

        $saleItem->update([
            'status' => $status,
            'accepted_qty' => $acceptedQty,
            'rejected_qty' => $rejectedQty + $changedQty,
            'final_qty' => $finalQty,
            'discount_usd' => $discount,
            'total_usd' => $lineTotal,
            'cogs_usd' => $remainingCogs,
            'profit_usd' => $profit,
        ]);
    }

    private function createSaleItemFromVariant(
        Sale $sale,
        ProductVariant $variant,
        int $qty,
        string $unitPrice,
        string $status,
        string $movementType,
        string $noteLabel,
        ?int $createdBy,
    ): SaleItem {
        $itemTotal = bcmul($unitPrice, (string) $qty, 4);

        $saleItem = $sale->items()->create([
            'product_variant_id' => $variant->id,
            'status' => $status,
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

        $cogs = $this->deductFifoStock(
            saleItem: $saleItem,
            variantId: $variant->id,
            qtyNeeded: $qty,
            saleId: $sale->id,
            movementType: $movementType,
            noteLabel: $noteLabel,
            createdBy: $createdBy,
        );

        $saleItem->update([
            'cogs_usd' => $cogs,
            'profit_usd' => bcsub($itemTotal, $cogs, 4),
        ]);

        $this->syncStockBalance->decrementOnHand($variant->id, $qty);

        return $saleItem->fresh();
    }

    private function deductFifoStock(
        SaleItem $saleItem,
        int $variantId,
        int $qtyNeeded,
        int $saleId,
        string $movementType,
        string $noteLabel,
        ?int $createdBy,
    ): string {
        $layers = StockLayer::query()
            ->where('product_variant_id', $variantId)
            ->where('remaining_qty', '>', 0)
            ->orderBy('purchase_date')
            ->orderBy('id')
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
                type: $movementType,
                qtyChange: -$deductFromLayer,
                stockLayerId: $layer->id,
                referenceType: (new Sale)->getMorphClass(),
                referenceId: $saleId,
                unitCostUsd: (string) $layer->unit_cost_usd,
                note: $noteLabel,
                createdBy: $createdBy,
            );

            $totalCogs = bcadd($totalCogs, $layerCost, 4);
            $remainingToDeduct -= $deductFromLayer;
        }

        if ($remainingToDeduct > 0) {
            throw new \RuntimeException("Insufficient stock for variant {$variantId}. Need {$qtyNeeded}, short by {$remainingToDeduct}.");
        }

        return $totalCogs;
    }

    private function proRateAmount(string $amount, int $qty, int $originalQty): string
    {
        if ($qty <= 0 || $originalQty <= 0) {
            return '0';
        }

        return bcmul($amount, bcdiv((string) $qty, (string) $originalQty, 4), 4);
    }

    private function determineActionType(int $acceptedQty, int $changedQty, int $rejectedQty, int $originalQty): string
    {
        if ($changedQty > 0) {
            return 'changed';
        }

        if ($acceptedQty === 0 && $rejectedQty === $originalQty) {
            return 'cancelled';
        }

        if ($acceptedQty === $originalQty) {
            return 'accepted';
        }

        if ($acceptedQty > 0 && $rejectedQty > 0) {
            return 'partially_accepted';
        }

        return 'rejected';
    }

    private function mapSaleOrderStatus(string $status, string $finalSubtotal): string
    {
        return match ($status) {
            'failed_delivery', 'cancelled_at_door' => 'cancelled',
            'partially_delivered' => 'completed',
            default => bccomp($finalSubtotal, '0', 4) > 0 ? 'completed' : 'cancelled',
        };
    }

    private function mapDeliveryStatus(string $status, string $finalSubtotal): string
    {
        return match ($status) {
            'failed_delivery' => 'failed',
            'cancelled_at_door' => 'cancelled',
            'partially_delivered' => bccomp($finalSubtotal, '0', 4) > 0 ? 'partially_delivered' : 'cancelled',
            default => bccomp($finalSubtotal, '0', 4) > 0 ? 'delivered' : 'cancelled',
        };
    }
}
