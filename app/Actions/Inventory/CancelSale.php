<?php

namespace App\Actions\Inventory;

use App\Models\Sale;
use Illuminate\Support\Facades\DB;

final class CancelSale
{
    public function __construct(
        private RecordStockMovement $recordStockMovement,
        private SyncStockBalance $syncStockBalance,
    ) {}

    public function handle(Sale $sale, ?int $cancelledBy = null): Sale
    {
        return DB::transaction(function () use ($sale, $cancelledBy): Sale {
            if ($sale->isCancelled()) {
                throw new \RuntimeException('Sale is already cancelled.');
            }

            foreach ($sale->items as $saleItem) {
                $totalQtyToRestore = 0;

                foreach ($saleItem->costLayers as $costLayer) {
                    $layer = $costLayer->stockLayer;

                    if ($layer) {
                        $layer->increment('remaining_qty', $costLayer->qty);
                    }

                    $this->recordStockMovement->handle(
                        productVariantId: $saleItem->product_variant_id,
                        type: 'sale_cancel',
                        qtyChange: $costLayer->qty,
                        stockLayerId: $costLayer->stock_layer_id,
                        referenceType: $sale->getMorphClass(),
                        referenceId: $sale->id,
                        unitCostUsd: (string) $costLayer->unit_cost_usd,
                        note: "Cancel sale #{$sale->invoice_no}",
                        createdBy: $cancelledBy,
                    );

                    $totalQtyToRestore += $costLayer->qty;
                }

                $this->syncStockBalance->incrementOnHand(
                    $saleItem->product_variant_id,
                    $totalQtyToRestore,
                );
            }

            $sale->update([
                'order_status' => 'cancelled',
                'payment_status' => 'cancelled',
            ]);

            return $sale->fresh();
        });
    }
}
