<?php

namespace App\Actions\Inventory;

final class AllocatePurchaseCosts
{
    public function allocateByQty(iterable $purchaseItems, string $totalExtraCostUsd): void
    {
        $totalQty = 0;

        foreach ($purchaseItems as $item) {
            $totalQty += $item->qty;
        }

        if ($totalQty === 0) {
            return;
        }

        $extraPerUnit = bcdiv($totalExtraCostUsd, (string) $totalQty, 6);

        foreach ($purchaseItems as $item) {
            $item->allocated_delivery_cost_usd = bcmul($extraPerUnit, (string) $item->qty, 4);
            $item->landed_unit_cost_usd = bcadd((string) $item->unit_cost_usd, $extraPerUnit, 4);
            $item->total_landed_cost_usd = bcmul((string) $item->landed_unit_cost_usd, (string) $item->qty, 4);
            $item->expected_profit_per_unit_usd = bcsub((string) $item->sale_price_usd, (string) $item->landed_unit_cost_usd, 4);
            $item->subtotal_usd = bcmul((string) $item->unit_cost_usd, (string) $item->qty, 4);
            $item->save();
        }
    }
}
