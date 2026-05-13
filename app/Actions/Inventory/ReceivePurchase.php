<?php

namespace App\Actions\Inventory;

use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\StockLayer;
use Illuminate\Support\Facades\DB;

final class ReceivePurchase
{
    public function __construct(
        private AllocatePurchaseCosts $allocateCosts,
        private RecordStockMovement $recordMovement,
        private SyncStockBalance $syncBalance,
    ) {}

    public function handle(Purchase $purchase): void
    {
        DB::transaction(function () use ($purchase): void {
            $items = $purchase->items()->get();

            $totalExtraCost = bcadd(
                (string) $purchase->purchase_delivery_cost_usd,
                (string) $purchase->other_cost_usd,
                4,
            );

            $this->allocateCosts->allocateByQty($items, $totalExtraCost);

            $subtotal = '0';
            $totalCost = '0';

            foreach ($items as $item) {
                $subtotal = bcadd($subtotal, (string) $item->subtotal_usd, 4);
                $totalCost = bcadd($totalCost, (string) $item->total_landed_cost_usd, 4);

                $this->createStockLayer($purchase, $item);
            }

            $purchase->update([
                'subtotal_usd' => $subtotal,
                'total_cost_usd' => $totalCost,
            ]);
        });
    }

    private function createStockLayer(Purchase $purchase, PurchaseItem $item): void
    {
        $layer = StockLayer::create([
            'purchase_item_id' => $item->id,
            'product_variant_id' => $item->product_variant_id,
            'original_qty' => $item->qty,
            'remaining_qty' => $item->qty,
            'unit_cost_usd' => $item->landed_unit_cost_usd,
            'purchase_date' => $purchase->purchase_date,
        ]);

        $this->recordMovement->handle(
            productVariantId: $item->product_variant_id,
            type: 'purchase',
            qtyChange: $item->qty,
            stockLayerId: $layer->id,
            referenceType: $purchase->getMorphClass(),
            referenceId: $purchase->id,
            unitCostUsd: $item->landed_unit_cost_usd,
            note: "Purchase #{$purchase->purchase_no}",
            createdBy: $purchase->created_by,
        );

        $this->syncBalance->incrementOnHand($item->product_variant_id, $item->qty);
    }
}
