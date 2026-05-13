<?php

namespace App\Http\Controllers\Inventory;

use App\Actions\Inventory\RecordStockMovement;
use App\Actions\Inventory\SyncStockBalance;
use App\Http\Controllers\Controller;
use App\Models\ProductVariant;
use App\Models\StockAdjustment;
use App\Models\StockBalance;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class StockAdjustmentController extends Controller
{
    public function __construct(
        private RecordStockMovement $recordStockMovement,
        private SyncStockBalance $syncStockBalance,
    ) {}

    public function index(Request $request): Response
    {
        $search = $request->string('search')->toString();

        $adjustments = StockAdjustment::query()
            ->with('items.productVariant.product')
            ->when($search !== '', fn ($q) => $q->where('reason', 'like', "%{$search}%"))
            ->orderByDesc('adjustment_date')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('inventory/stock-adjustments/index', [
            'adjustments' => $adjustments,
            'filters' => ['search' => $search],
        ]);
    }

    public function create(): Response
    {
        $variants = ProductVariant::query()
            ->with(['product:id,name', 'stockBalance'])
            ->where('status', 'active')
            ->orderBy('sku')
            ->get(['id', 'product_id', 'sku', 'size', 'color']);

        return Inertia::render('inventory/stock-adjustments/create', [
            'variants' => $variants->map(fn ($v) => [
                'id' => $v->id,
                'sku' => $v->sku,
                'size' => $v->size,
                'color' => $v->color,
                'product_name' => $v->product?->name,
                'stock_on_hand' => $v->stockBalance?->qty_on_hand ?? 0,
            ]),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'adjustment_date' => ['required', 'date'],
            'reason' => ['nullable', 'string'],
            'note' => ['nullable', 'string'],
            'items' => ['required', 'array'],
            'items.*.product_variant_id' => ['required', 'integer', 'exists:product_variants,id'],
            'items.*.actual_qty' => ['required', 'integer', 'min:0'],
            'items.*.note' => ['nullable', 'string'],
        ]);

        DB::transaction(function () use ($validated) {
            $adjustment = StockAdjustment::create([
                'adjustment_date' => $validated['adjustment_date'],
                'reason' => $validated['reason'],
                'note' => $validated['note'],
                'created_by' => auth()->id(),
            ]);

            foreach ($validated['items'] as $item) {
                $balance = StockBalance::where('product_variant_id', $item['product_variant_id'])->first();
                $systemQty = $balance?->qty_on_hand ?? 0;
                $actualQty = (int) $item['actual_qty'];
                $diff = $actualQty - $systemQty;

                $adjustment->items()->create([
                    'product_variant_id' => $item['product_variant_id'],
                    'system_qty' => $systemQty,
                    'actual_qty' => $actualQty,
                    'difference_qty' => $diff,
                    'movement_type' => $diff >= 0 ? 'adjustment_in' : 'adjustment_out',
                    'note' => $item['note'] ?? null,
                ]);
            }
        });

        return to_route('stock-adjustments.index')->with('toast', ['type' => 'success', 'message' => 'Stock adjustment created.']);
    }

    public function show(StockAdjustment $stockAdjustment): Response
    {
        $stockAdjustment->load('items.productVariant.product', 'createdBy', 'approvedBy');

        return Inertia::render('inventory/stock-adjustments/show', [
            'adjustment' => $stockAdjustment,
        ]);
    }

    public function approve(StockAdjustment $stockAdjustment): RedirectResponse
    {
        if ($stockAdjustment->approved_at) {
            return back()->withErrors(['general' => 'Adjustment already approved.']);
        }

        DB::transaction(function () use ($stockAdjustment) {
            foreach ($stockAdjustment->items as $item) {
                $qtyChange = $item->difference_qty;
                if ($qtyChange === 0) {
                    continue;
                }

                $this->recordStockMovement->handle(
                    productVariantId: $item->product_variant_id,
                    type: $qtyChange > 0 ? 'adjustment_in' : 'adjustment_out',
                    qtyChange: abs($qtyChange),
                    stockLayerId: null,
                    referenceType: $stockAdjustment->getMorphClass(),
                    referenceId: $stockAdjustment->id,
                    unitCostUsd: null,
                    note: "Stock adjustment #{$stockAdjustment->id}: {$item->note}",
                    createdBy: auth()->id(),
                );

                $this->syncStockBalance->incrementOnHand($item->product_variant_id, $qtyChange);
            }

            $stockAdjustment->update([
                'approved_by' => auth()->id(),
                'approved_at' => now(),
            ]);
        });

        return to_route('stock-adjustments.index')->with('toast', ['type' => 'success', 'message' => 'Stock adjustment approved and applied.']);
    }
}
