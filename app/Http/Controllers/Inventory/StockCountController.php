<?php

namespace App\Http\Controllers\Inventory;

use App\Actions\Inventory\RecordStockMovement;
use App\Actions\Inventory\SyncStockBalance;
use App\Http\Controllers\Controller;
use App\Models\ProductVariant;
use App\Models\StockBalance;
use App\Models\StockCount;
use App\Models\StockLayer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class StockCountController extends Controller
{
    public function __construct(
        private RecordStockMovement $recordStockMovement,
        private SyncStockBalance $syncStockBalance,
    ) {}

    public function index(Request $request): Response
    {
        $search = $request->string('search')->toString();

        $counts = StockCount::query()
            ->with('items.productVariant.product')
            ->when($search !== '', fn ($q) => $q->whereDate('count_date', $search))
            ->orderByDesc('count_date')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('inventory/stock-counts/index', [
            'counts' => $counts,
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

        return Inertia::render('inventory/stock-counts/create', [
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
            'count_date' => ['required', 'date'],
            'note' => ['nullable', 'string'],
            'items' => ['required', 'array'],
            'items.*.product_variant_id' => ['required', 'integer', 'exists:product_variants,id'],
            'items.*.actual_qty' => ['required', 'integer', 'min:0'],
            'items.*.note' => ['nullable', 'string'],
        ]);

        DB::transaction(function () use ($validated) {
            $count = StockCount::create([
                'count_date' => $validated['count_date'],
                'note' => $validated['note'],
                'counted_by' => auth()->id(),
            ]);

            foreach ($validated['items'] as $item) {
                $balance = StockBalance::where('product_variant_id', $item['product_variant_id'])->first();
                $systemQty = $balance?->qty_on_hand ?? 0;
                $actualQty = (int) $item['actual_qty'];

                $count->items()->create([
                    'product_variant_id' => $item['product_variant_id'],
                    'system_qty' => $systemQty,
                    'actual_qty' => $actualQty,
                    'difference_qty' => $actualQty - $systemQty,
                    'note' => $item['note'] ?? null,
                ]);
            }
        });

        return to_route('stock-counts.index')->with('toast', ['type' => 'success', 'message' => 'Stock count created.']);
    }

    public function show(StockCount $stockCount): Response
    {
        $stockCount->load('items.productVariant.product', 'countedBy');

        return Inertia::render('inventory/stock-counts/show', [
            'count' => $stockCount,
        ]);
    }

    public function approve(StockCount $stockCount): RedirectResponse
    {
        if ($stockCount->status !== 'draft') {
            return back()->withErrors(['general' => 'Stock count already processed.']);
        }

        DB::transaction(function () use ($stockCount) {
            foreach ($stockCount->items as $item) {
                $qtyChange = $item->difference_qty;
                if ($qtyChange === 0) {
                    continue;
                }

                $stockLayerId = null;

                if ($qtyChange > 0) {
                    // Create a stock layer so these units are sellable via FIFO
                    $layer = StockLayer::create([
                        'purchase_item_id' => null,
                        'product_variant_id' => $item->product_variant_id,
                        'original_qty' => $qtyChange,
                        'remaining_qty' => $qtyChange,
                        'unit_cost_usd' => '0',
                        'purchase_date' => $stockCount->count_date,
                    ]);
                    $stockLayerId = $layer->id;
                } else {
                    // For adjustment_out, deduct from oldest layers first (FIFO)
                    $toDeduct = abs($qtyChange);
                    $layers = StockLayer::where('product_variant_id', $item->product_variant_id)
                        ->where('remaining_qty', '>', 0)
                        ->orderBy('purchase_date', 'asc')
                        ->orderBy('id', 'asc')
                        ->get();

                    foreach ($layers as $layer) {
                        if ($toDeduct <= 0) {
                            break;
                        }
                        $deduct = min($toDeduct, $layer->remaining_qty);
                        $layer->decrement('remaining_qty', $deduct);
                        $toDeduct -= $deduct;
                    }
                }

                $this->recordStockMovement->handle(
                    productVariantId: $item->product_variant_id,
                    type: $qtyChange > 0 ? 'adjustment_in' : 'adjustment_out',
                    qtyChange: $qtyChange,
                    stockLayerId: $stockLayerId,
                    referenceType: $stockCount->getMorphClass(),
                    referenceId: $stockCount->id,
                    unitCostUsd: null,
                    note: "Stock count #{$stockCount->id}: missing stock",
                    createdBy: auth()->id(),
                );

                $this->syncStockBalance->incrementOnHand($item->product_variant_id, $qtyChange);
            }

            $stockCount->update(['status' => 'adjusted']);
        });

        return to_route('stock-counts.index')->with('toast', ['type' => 'success', 'message' => 'Stock count approved and stock adjusted.']);
    }
}
