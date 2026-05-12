<?php

namespace App\Actions\Inventory;

use App\Models\StockBalance;
use App\Models\StockMovement;

final class SyncStockBalance
{
    public function incrementOnHand(int $productVariantId, int $qty): StockBalance
    {
        return StockBalance::updateOrCreate(
            ['product_variant_id' => $productVariantId],
            ['qty_on_hand' => StockBalance::getOnHand($productVariantId) + $qty],
        );
    }

    public function decrementOnHand(int $productVariantId, int $qty): StockBalance
    {
        return StockBalance::updateOrCreate(
            ['product_variant_id' => $productVariantId],
            ['qty_on_hand' => max(0, StockBalance::getOnHand($productVariantId) - $qty)],
        );
    }

    public function recalculate(int $productVariantId): StockBalance
    {
        $total = StockMovement::where('product_variant_id', $productVariantId)
            ->sum('qty_change');

        return StockBalance::updateOrCreate(
            ['product_variant_id' => $productVariantId],
            ['qty_on_hand' => (int) $total],
        );
    }
}
