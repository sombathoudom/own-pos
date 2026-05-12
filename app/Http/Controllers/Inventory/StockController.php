<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\ProductVariant;
use App\Models\Purchase;
use App\Models\Sale;
use App\Models\StockMovement;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StockController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->string('search')->toString();

        $variants = ProductVariant::query()
            ->with('product.category', 'stockBalance')
            ->when($search !== '', function ($q) use ($search) {
                $q->where(function ($query) use ($search) {
                    $query->where('sku', 'like', "%{$search}%")
                        ->orWhere('color', 'like', "%{$search}%")
                        ->orWhere('size', 'like', "%{$search}%")
                        ->orWhereHas('product', fn ($pq) => $pq->where('name', 'like', "%{$search}%"));
                });
            })
            ->orderBy('id')
            ->paginate(20)
            ->withQueryString()
            ->through(fn (ProductVariant $variant) => [
                'id' => $variant->id,
                'sku' => $variant->sku,
                'color' => $variant->color,
                'size' => $variant->size,
                'sale_price_usd' => $variant->sale_price_usd,
                'product' => [
                    'id' => $variant->product?->id,
                    'name' => $variant->product?->name,
                    'category' => $variant->product?->category,
                ],
                'stockBalance' => $variant->stockBalance,
            ]);

        return Inertia::render('inventory/stock/index', [
            'variants' => $variants,
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    public function movements(Request $request): Response
    {
        $productVariantId = $request->integer('product_variant_id');
        $type = $request->string('type')->toString();

        $movements = StockMovement::query()
            ->with('productVariant.product', 'stockLayer')
            ->when($productVariantId, fn ($query, $id) => $query->where('product_variant_id', $id))
            ->when($type !== '', fn ($query) => $query->where('type', $type))
            ->orderByDesc('created_at')
            ->paginate(20)
            ->withQueryString()
            ->through(function (StockMovement $movement) {
                $reference = null;
                if ($movement->reference_type && $movement->reference_id) {
                    $refClass = match ($movement->reference_type) {
                        'sale', Sale::class => Sale::class,
                        'purchase', Purchase::class => Purchase::class,
                        default => $movement->reference_type,
                    };

                    if (class_exists($refClass)) {
                        $refModel = $refClass::find($movement->reference_id);
                        if ($refModel) {
                            $reference = [
                                'id' => $refModel->id,
                                'type' => class_basename($refClass),
                                'label' => match (true) {
                                    $refModel instanceof Purchase => $refModel->purchase_no,
                                    $refModel instanceof Sale => $refModel->invoice_no,
                                    default => null,
                                },
                            ];
                        }
                    }
                }

                return [
                    'id' => $movement->id,
                    'type' => $movement->type,
                    'product_variant_id' => $movement->product_variant_id,
                    'qty_change' => $movement->qty_change,
                    'unit_cost_usd' => $movement->unit_cost_usd,
                    'note' => $movement->note,
                    'created_at' => $movement->created_at?->toDateTimeString(),
                    'productVariant' => $movement->productVariant ? [
                        'id' => $movement->productVariant->id,
                        'sku' => $movement->productVariant->sku,
                        'color' => $movement->productVariant->color,
                        'size' => $movement->productVariant->size,
                        'product' => $movement->productVariant->product,
                    ] : null,
                    'stockLayer' => $movement->stockLayer,
                    'reference' => $reference,
                ];
            });

        return Inertia::render('inventory/stock/movements', [
            'movements' => $movements,
            'filters' => [
                'product_variant_id' => $productVariantId ? (string) $productVariantId : '',
                'type' => $type,
            ],
        ]);
    }
}
