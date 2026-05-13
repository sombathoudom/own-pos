<?php

namespace App\Actions\Inventory;

use App\Models\ProductVariant;
use App\Models\Sale;
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
     */
    public function handle(Sale $sale, array $exchangeItems, ?string $note = null, ?int $createdBy = null): void
    {
        DB::transaction(function () use ($sale, $exchangeItems, $createdBy): void {
            if ($sale->isCancelled()) {
                throw new \RuntimeException('Cannot exchange a cancelled sale.');
            }

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

                $maxExchange = $saleItem->qty - $alreadyReturned;
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

                $this->exchangeOut($saleItem, $exchangeQty, $sale, $createdBy);
                $this->exchangeIn($saleItem, $exchangeQty, $newVariant, $newUnitPrice, $sale, $createdBy);
            }
        });
    }

    private function exchangeOut(SaleItem $saleItem, int $qty, Sale $sale, ?int $createdBy): void
    {
        $remainingToRestore = $qty;

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
                type: 'exchange_in',
                qtyChange: $restoreQty,
                stockLayerId: $costLayer->stock_layer_id,
                referenceType: $sale->getMorphClass(),
                referenceId: $sale->id,
                unitCostUsd: (string) $costLayer->unit_cost_usd,
                note: "Exchange out for sale #{$sale->invoice_no}",
                createdBy: $createdBy,
            );

            $remainingToRestore -= $restoreQty;
        }

        $this->syncStockBalance->incrementOnHand($saleItem->product_variant_id, $qty);
    }

    private function exchangeIn(SaleItem $saleItem, int $qty, ProductVariant $newVariant, string $unitPrice, Sale $sale, ?int $createdBy): void
    {
        $itemTotal = bcmul($unitPrice, (string) $qty, 4);

        $newSaleItem = $sale->items()->create([
            'product_variant_id' => $newVariant->id,
            'qty' => $qty,
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
