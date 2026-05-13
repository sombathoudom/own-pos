<?php

namespace App\Http\Controllers\Inventory;

use App\Actions\Inventory\CancelSale;
use App\Actions\Inventory\CreateSale;
use App\Actions\Inventory\ExchangeSale;
use App\Actions\Inventory\ReturnSale;
use App\Http\Controllers\Controller;
use App\Http\Requests\Inventory\StoreSaleRequest;
use App\Models\Category;
use App\Models\ProductVariant;
use App\Models\Sale;
use App\Services\DailyClosingLock;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class SaleController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->string('search')->toString();

        $sales = Sale::query()
            ->with('items.productVariant.product')
            ->when($search !== '', fn ($query) => $query->where('invoice_no', 'like', "%{$search}%")
                ->orWhere('customer_name', 'like', "%{$search}%"))
            ->orderByDesc('sale_date')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('inventory/sales/index', [
            'sales' => $sales,
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    public function create(): Response
    {
        $variants = ProductVariant::query()
            ->with(['product:id,name,category_id', 'product.category:id,name', 'stockBalance'])
            ->where('status', 'active')
            ->orderBy('sku')
            ->get(['id', 'product_id', 'sku', 'style_name', 'color', 'size', 'sale_price_usd']);

        return Inertia::render('inventory/sales/create', [
            'variants' => $variants->map(fn ($v) => [
                'id' => $v->id,
                'sku' => $v->sku,
                'style_name' => $v->style_name,
                'color' => $v->color,
                'size' => $v->size,
                'sale_price_usd' => $v->sale_price_usd,
                'stock_on_hand' => $v->stockBalance?->qty_on_hand ?? 0,
                'product' => [
                    'id' => $v->product?->id,
                    'name' => $v->product?->name,
                    'category' => $v->product?->category?->name,
                ],
            ]),
            'invoiceNo' => 'INV-'.now()->format('Ymd').'-'.Str::upper(Str::random(4)),
        ]);
    }

    public function pos(): Response
    {
        $variants = ProductVariant::query()
            ->with(['product:id,name,category_id,image_path', 'product.category:id,name', 'stockBalance'])
            ->where('status', 'active')
            ->orderBy('sku')
            ->get(['id', 'product_id', 'sku', 'style_name', 'color', 'size', 'sale_price_usd']);

        $categories = Category::where('status', 'active')->orderBy('name')->pluck('name', 'id');

        $sizes = $variants->pluck('size')->unique()->sort()->values();

        return Inertia::render('inventory/pos/index', [
            'variants' => $variants->map(fn ($v) => [
                'id' => $v->id,
                'sku' => $v->sku,
                'style_name' => $v->style_name,
                'color' => $v->color,
                'size' => $v->size,
                'sale_price_usd' => $v->sale_price_usd,
                'stock_on_hand' => $v->stockBalance?->qty_on_hand ?? 0,
                'product' => [
                    'id' => $v->product?->id,
                    'name' => $v->product?->name,
                    'category_id' => $v->product?->category_id,
                    'category' => $v->product?->category?->name,
                    'image_url' => $v->product?->imageUrl(),
                ],
            ]),
            'categories' => $categories,
            'sizes' => $sizes,
        ]);
    }

    public function store(StoreSaleRequest $request, CreateSale $createSale): RedirectResponse
    {
        $validated = $request->validated();

        try {
            DailyClosingLock::ensureNotLocked($validated['sale_date'], 'This day has been closed. New sales cannot be added.');

            $sale = $createSale->handle(
                saleData: [
                    'invoice_no' => 'INV-'.now()->format('Ymd').'-'.Str::upper(Str::random(4)),
                    'customer_name' => $validated['customer_name'] ?? null,
                    'customer_phone' => $validated['customer_phone'] ?? null,
                    'customer_address' => $validated['customer_address'] ?? null,
                    'sale_date' => $validated['sale_date'],
                    'currency' => $validated['currency'] ?? 'USD',
                    'exchange_rate' => $validated['exchange_rate'] ?? 1,
                    'discount_usd' => $validated['discount_usd'] ?? 0,
                    'customer_delivery_fee_usd' => $validated['customer_delivery_fee_usd'] ?? 0,
                    'actual_delivery_cost_usd' => $validated['actual_delivery_cost_usd'] ?? 0,
                    'paid_usd' => $validated['paid_usd'] ?? 0,
                    'note' => $validated['note'] ?? null,
                ],
                items: $validated['items'],
                createdBy: $request->user()?->id,
            );
        } catch (Throwable $e) {
            return back()->withErrors(['items' => $e->getMessage()]);
        }

        return to_route('sales.show', $sale)->with('toast', ['type' => 'success', 'message' => 'Sale created and stock deducted.']);
    }

    public function cancel(Request $request, Sale $sale, CancelSale $cancelSale): RedirectResponse
    {
        $validated = $request->validate([
            'reason' => ['nullable', 'string'],
        ]);

        try {
            DailyClosingLock::ensureNotLocked($sale->sale_date, 'This day has been closed. Sales cannot be cancelled.');

            $cancelSale->handle($sale, auth()->id(), $validated['reason'] ?? null);
        } catch (Throwable $e) {
            return back()->withErrors(['general' => $e->getMessage()]);
        }

        return to_route('sales.show', $sale)->with('toast', ['type' => 'success', 'message' => 'Sale cancelled and stock restored.']);
    }

    public function return(Request $request, Sale $sale, ReturnSale $returnSale): RedirectResponse
    {
        $validated = $request->validate([
            'returned_at' => ['required', 'date'],
            'items' => ['required', 'array'],
            'items.*.sale_item_id' => ['required', 'integer', 'exists:sale_items,id'],
            'items.*.qty' => ['required', 'integer', 'min:1'],
            'note' => ['nullable', 'string'],
        ]);

        try {
            $returnSale->handle(
                sale: $sale,
                items: $validated['items'],
                returnedAt: $validated['returned_at'],
                note: $validated['note'] ?? null,
                createdBy: auth()->id(),
            );
        } catch (Throwable $e) {
            return back()->withErrors(['general' => $e->getMessage()]);
        }

        return to_route('sales.show', $sale)->with('toast', ['type' => 'success', 'message' => 'Items returned and stock restored.']);
    }

    public function exchange(Request $request, Sale $sale, ExchangeSale $exchangeSale): RedirectResponse
    {
        $validated = $request->validate([
            'items' => ['required', 'array'],
            'items.*.sale_item_id' => ['required', 'integer', 'exists:sale_items,id'],
            'items.*.qty' => ['required', 'integer', 'min:1'],
            'items.*.new_variant_id' => ['required', 'integer', 'exists:product_variants,id'],
            'items.*.new_unit_price' => ['required', 'numeric', 'min:0'],
            'note' => ['nullable', 'string'],
        ]);

        try {
            $exchangeSale->handle(
                sale: $sale,
                exchangeItems: $validated['items'],
                note: $validated['note'] ?? null,
                createdBy: auth()->id(),
            );
        } catch (Throwable $e) {
            return back()->withErrors(['general' => $e->getMessage()]);
        }

        return to_route('sales.show', $sale)->with('toast', ['type' => 'success', 'message' => 'Items exchanged and stock updated.']);
    }

    public function updatePayment(Request $request, Sale $sale): RedirectResponse
    {
        $validated = $request->validate([
            'paid_usd' => ['required', 'numeric', 'min:0'],
            'payment_note' => ['nullable', 'string', 'max:500'],
        ]);

        try {
            DailyClosingLock::ensureNotLocked($sale->sale_date, 'This day has been closed. Payment cannot be updated.');

            $paid = (string) $validated['paid_usd'];
            $total = (string) $sale->total_usd;

            $paymentStatus = 'unpaid';
            if (bccomp($paid, $total, 4) >= 0) {
                $paymentStatus = 'paid';
            } elseif (bccomp($paid, '0', 4) > 0) {
                $paymentStatus = 'partial';
            }

            $sale->update([
                'paid_usd' => $paid,
                'payment_status' => $paymentStatus,
            ]);
        } catch (Throwable $e) {
            return back()->withErrors(['general' => $e->getMessage()]);
        }

        return to_route('sales.show', $sale)->with('toast', ['type' => 'success', 'message' => 'Payment updated successfully.']);
    }

    public function show(Sale $sale): Response
    {
        $sale->load('items.productVariant.product', 'items.costLayers.stockLayer', 'createdBy', 'returns.items');

        $variants = ProductVariant::query()
            ->with(['product:id,name,category_id', 'product.category:id,name', 'stockBalance'])
            ->where('status', 'active')
            ->orderBy('sku')
            ->get(['id', 'product_id', 'sku', 'style_name', 'color', 'size', 'sale_price_usd']);

        return Inertia::render('inventory/sales/show', [
            'variants' => $variants->map(fn ($v) => [
                'id' => $v->id,
                'sku' => $v->sku,
                'style_name' => $v->style_name,
                'color' => $v->color,
                'size' => $v->size,
                'sale_price_usd' => $v->sale_price_usd,
                'stock_on_hand' => $v->stockBalance?->qty_on_hand ?? 0,
                'product' => [
                    'id' => $v->product?->id,
                    'name' => $v->product?->name,
                    'category' => $v->product?->category?->name,
                ],
            ]),
            'sale' => [
                'id' => $sale->id,
                'invoice_no' => $sale->invoice_no,
                'customer_name' => $sale->customer_name,
                'customer_phone' => $sale->customer_phone,
                'sale_date' => $sale->sale_date?->toDateString(),
                'currency' => $sale->currency,
                'exchange_rate' => $sale->exchange_rate,
                'subtotal_usd' => $sale->subtotal_usd,
                'discount_usd' => $sale->discount_usd,
                'customer_delivery_fee_usd' => $sale->customer_delivery_fee_usd,
                'actual_delivery_cost_usd' => $sale->actual_delivery_cost_usd,
                'delivery_profit_usd' => $sale->delivery_profit_usd,
                'total_usd' => $sale->total_usd,
                'paid_usd' => $sale->paid_usd,
                'payment_status' => $sale->payment_status,
                'order_status' => $sale->order_status,
                'note' => $sale->note,
                'created_by' => $sale->createdBy,
                'items' => $sale->items->map(fn ($item) => [
                    'id' => $item->id,
                    'qty' => $item->qty,
                    'unit_price_usd' => $item->unit_price_usd,
                    'discount_usd' => $item->discount_usd,
                    'total_usd' => $item->total_usd,
                    'cogs_usd' => $item->cogs_usd,
                    'profit_usd' => $item->profit_usd,
                    'product_variant' => [
                        'id' => $item->productVariant?->id,
                        'sku' => $item->productVariant?->sku,
                        'color' => $item->productVariant?->color,
                        'size' => $item->productVariant?->size,
                        'product_name' => $item->productVariant?->product?->name,
                    ],
                    'cost_layers' => $item->costLayers->map(fn ($cl) => [
                        'qty' => $cl->qty,
                        'unit_cost_usd' => $cl->unit_cost_usd,
                        'total_cost_usd' => $cl->total_cost_usd,
                    ]),
                ]),
                'returns' => $sale->returns->map(fn ($ret) => [
                    'id' => $ret->id,
                    'returned_at' => $ret->returned_at?->toDateString(),
                    'total_refund_usd' => $ret->total_refund_usd,
                    'note' => $ret->note,
                    'items' => $ret->items->map(fn ($ri) => [
                        'id' => $ri->id,
                        'sale_item_id' => $ri->sale_item_id,
                        'qty' => $ri->qty,
                        'refund_usd' => $ri->refund_usd,
                    ]),
                ]),
            ],
        ]);
    }
}
