<?php

namespace App\Actions\Inventory;

use App\Models\StockMovement;

final class RecordStockMovement
{
    public function handle(
        int $productVariantId,
        string $type,
        int $qtyChange,
        ?int $stockLayerId = null,
        ?string $referenceType = null,
        ?int $referenceId = null,
        ?string $unitCostUsd = null,
        ?string $note = null,
        ?int $createdBy = null,
    ): StockMovement {
        return StockMovement::create([
            'product_variant_id' => $productVariantId,
            'stock_layer_id' => $stockLayerId,
            'type' => $type,
            'qty_change' => $qtyChange,
            'reference_type' => $referenceType,
            'reference_id' => $referenceId,
            'unit_cost_usd' => $unitCostUsd,
            'note' => $note,
            'created_by' => $createdBy,
        ]);
    }
}
