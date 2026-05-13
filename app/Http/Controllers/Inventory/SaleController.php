<?php

namespace App\Http\Controllers\Inventory;

use App\Actions\Inventory\CancelSale;
use App\Actions\Inventory\ConfirmSaleDelivery;
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
            'items' => ['sometimes', 'array'],
            'items.*.sale_item_id' => ['required', 'integer', 'exists:sale_items,id'],
            'items.*.qty' => ['required', 'integer', 'min:1'],
            'items.*.new_variant_id' => ['required', 'integer', 'exists:product_variants,id'],
            'items.*.new_unit_price' => ['required', 'numeric', 'min:0'],
            'new_items' => ['sometimes', 'array'],
            'new_items.*.product_variant_id' => ['required', 'integer', 'exists:product_variants,id'],
            'new_items.*.qty' => ['required', 'integer', 'min:1'],
            'new_items.*.unit_price_usd' => ['required', 'numeric', 'min:0'],
            'exchange_delivery_fee_usd' => ['sometimes', 'numeric', 'min:0'],
            'exchange_delivery_cost_usd' => ['sometimes', 'numeric', 'min:0'],
            'exchange_date' => ['nullable', 'date'],
            'note' => ['nullable', 'string'],
        ]);

        try {
            $exchangeSale->handle(
                sale: $sale,
                exchangeItems: $validated['items'] ?? [],
                newItems: $validated['new_items'] ?? [],
                exchangeDeliveryFeeUsd: (string) ($validated['exchange_delivery_fee_usd'] ?? '0'),
                exchangeDeliveryCostUsd: (string) ($validated['exchange_delivery_cost_usd'] ?? '0'),
                exchangeDate: $validated['exchange_date'] ?? null,
                note: $validated['note'] ?? null,
                createdBy: auth()->id(),
            );
        } catch (Throwable $e) {
            return back()->withErrors(['general' => $e->getMessage()]);
        }

        return to_route('sales.show', $sale)->with('toast', ['type' => 'success', 'message' => 'Items exchanged and stock updated.']);
    }

    public function confirmDelivery(Sale $sale): Response
    {
        $sale->load('items.productVariant.product', 'delivery', 'deliveryConfirmations');

        $variants = ProductVariant::query()
            ->with(['product:id,name,category_id', 'product.category:id,name', 'stockBalance'])
            ->where('status', 'active')
            ->orderBy('sku')
            ->get(['id', 'product_id', 'sku', 'style_name', 'color', 'size', 'sale_price_usd']);

        return Inertia::render('inventory/sales/confirm-delivery', [
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
                'sale_date' => $sale->sale_date?->toDateString(),
                'customer_name' => $sale->customer_name,
                'discount_usd' => $sale->discount_usd,
                'subtotal_usd' => $sale->subtotal_usd,
                'customer_delivery_fee_usd' => $sale->customer_delivery_fee_usd,
                'actual_delivery_cost_usd' => $sale->actual_delivery_cost_usd,
                'order_status' => $sale->order_status,
                'delivery_completed_date' => $sale->delivery_completed_date?->toDateString(),
                'items' => $sale->items->map(fn ($item) => [
                    'id' => $item->id,
                    'qty' => $item->qty,
                    'unit_price_usd' => $item->unit_price_usd,
                    'product_variant' => [
                        'id' => $item->productVariant?->id,
                        'sku' => $item->productVariant?->sku,
                        'color' => $item->productVariant?->color,
                        'size' => $item->productVariant?->size,
                        'product_name' => $item->productVariant?->product?->name,
                    ],
                ]),
                'delivery' => $sale->delivery ? [
                    'customer_delivery_fee_usd' => $sale->delivery->customer_delivery_fee_usd,
                    'actual_delivery_cost_usd' => $sale->delivery->actual_delivery_cost_usd,
                    'delivery_status' => $sale->delivery->delivery_status,
                ] : null,
                'has_delivery_confirmation' => $sale->deliveryConfirmations->isNotEmpty(),
            ],
        ]);
    }

    public function storeDeliveryConfirmation(Request $request, Sale $sale, ConfirmSaleDelivery $confirmSaleDelivery): RedirectResponse
    {
        $validated = $request->validate([
            'confirmation_date' => ['required', 'date'],
            'status' => ['required', 'string', 'in:delivered,partially_delivered,changed_items,added_items,cancelled_at_door,failed_delivery'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.sale_item_id' => ['required', 'integer', 'exists:sale_items,id'],
            'items.*.accepted_qty' => ['required', 'integer', 'min:0'],
            'items.*.changed_qty' => ['sometimes', 'integer', 'min:0'],
            'items.*.new_variant_id' => ['nullable', 'integer', 'exists:product_variants,id'],
            'items.*.new_unit_price' => ['nullable', 'numeric', 'min:0'],
            'items.*.note' => ['nullable', 'string'],
            'added_items' => ['sometimes', 'array'],
            'added_items.*.product_variant_id' => ['required', 'integer', 'exists:product_variants,id'],
            'added_items.*.qty' => ['required', 'integer', 'min:1'],
            'added_items.*.unit_price_usd' => ['required', 'numeric', 'min:0'],
            'added_items.*.note' => ['nullable', 'string'],
            'final_delivery_fee_usd' => ['required', 'numeric', 'min:0'],
            'actual_delivery_cost_usd' => ['required', 'numeric', 'min:0'],
            'delivery_fee_note' => ['nullable', 'string'],
            'note' => ['nullable', 'string'],
        ]);

        try {
            $confirmSaleDelivery->handle(
                sale: $sale,
                confirmationDate: $validated['confirmation_date'],
                status: $validated['status'],
                items: $validated['items'],
                addedItems: $validated['added_items'] ?? [],
                finalDeliveryFeeUsd: (string) $validated['final_delivery_fee_usd'],
                actualDeliveryCostUsd: (string) $validated['actual_delivery_cost_usd'],
                deliveryFeeNote: $validated['delivery_fee_note'] ?? null,
                note: $validated['note'] ?? null,
                confirmedBy: auth()->id(),
            );
        } catch (Throwable $e) {
            return back()->withErrors(['general' => $e->getMessage()]);
        }

        return to_route('sales.show', $sale)->with('toast', ['type' => 'success', 'message' => 'Delivery confirmed and sale finalized.']);
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

            $updateData = [
                'paid_usd' => $paid,
                'payment_status' => $paymentStatus,
            ];

            if ($paymentStatus === 'paid' && ! $sale->payment_received_date) {
                $updateData['payment_received_date'] = now()->toDateString();
            }

            $sale->update($updateData);
        } catch (Throwable $e) {
            return back()->withErrors(['general' => $e->getMessage()]);
        }

        return to_route('sales.show', $sale)->with('toast', ['type' => 'success', 'message' => 'Payment updated successfully.']);
    }

    public function show(Sale $sale): Response
    {
        $sale->load('items.productVariant.product', 'items.costLayers.stockLayer', 'createdBy', 'returns.items', 'exchanges.items.saleItem.productVariant', 'exchanges.items.newVariant.product', 'exchanges.items.newSaleItem.productVariant', 'deliveryConfirmations.items.originalVariant.product', 'deliveryConfirmations.items.finalVariant.product');

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
                'original_subtotal_usd' => $sale->original_subtotal_usd,
                'subtotal_usd' => $sale->subtotal_usd,
                'discount_usd' => $sale->discount_usd,
                'original_delivery_fee_usd' => $sale->original_delivery_fee_usd,
                'customer_delivery_fee_usd' => $sale->customer_delivery_fee_usd,
                'actual_delivery_cost_usd' => $sale->actual_delivery_cost_usd,
                'delivery_profit_usd' => $sale->delivery_profit_usd,
                'original_total_usd' => $sale->original_total_usd,
                'total_usd' => $sale->total_usd,
                'paid_usd' => $sale->paid_usd,
                'payment_received_date' => $sale->payment_received_date?->toDateString(),
                'delivery_completed_date' => $sale->delivery_completed_date?->toDateString(),
                'payment_status' => $sale->payment_status,
                'order_status' => $sale->order_status,
                'note' => $sale->note,
                'created_by' => $sale->createdBy,
                'items' => $sale->items->map(fn ($item) => [
                    'id' => $item->id,
                    'status' => $item->status,
                    'qty' => $item->qty,
                    'accepted_qty' => $item->accepted_qty,
                    'rejected_qty' => $item->rejected_qty,
                    'final_qty' => $item->final_qty,
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
                    'payment_received_date' => $ret->payment_received_date?->toDateString(),
                    'note' => $ret->note,
                    'items' => $ret->items->map(fn ($ri) => [
                        'id' => $ri->id,
                        'sale_item_id' => $ri->sale_item_id,
                        'qty' => $ri->qty,
                        'refund_usd' => $ri->refund_usd,
                    ]),
                ]),
                'exchanges' => $sale->exchanges->map(fn ($ex) => [
                    'id' => $ex->id,
                    'exchange_date' => $ex->exchange_date?->toDateString(),
                    'payment_received_date' => $ex->payment_received_date?->toDateString(),
                    'exchange_delivery_fee_usd' => $ex->exchange_delivery_fee_usd,
                    'exchange_delivery_cost_usd' => $ex->exchange_delivery_cost_usd,
                    'subtotal_adjustment_usd' => $ex->subtotal_adjustment_usd,
                    'new_items_subtotal_usd' => $ex->new_items_subtotal_usd,
                    'total_additional_amount_usd' => $ex->total_additional_amount_usd,
                    'additional_cogs_usd' => $ex->additional_cogs_usd,
                    'additional_profit_usd' => $ex->additional_profit_usd,
                    'additional_qty_sold' => $ex->additional_qty_sold,
                    'note' => $ex->note,
                    'created_at' => $ex->created_at?->toDateString(),
                    'items' => $ex->items->map(fn ($ei) => [
                        'id' => $ei->id,
                        'sale_item_id' => $ei->sale_item_id,
                        'new_sale_item_id' => $ei->new_sale_item_id,
                        'qty_returned' => $ei->qty_returned,
                        'original_variant' => [
                            'sku' => $ei->saleItem?->productVariant?->sku,
                            'product_name' => $ei->saleItem?->productVariant?->product?->name,
                            'color' => $ei->saleItem?->productVariant?->color,
                            'size' => $ei->saleItem?->productVariant?->size,
                        ],
                        'new_variant' => [
                            'sku' => $ei->newVariant?->sku,
                            'product_name' => $ei->newVariant?->product?->name,
                            'color' => $ei->newVariant?->color,
                            'size' => $ei->newVariant?->size,
                        ],
                        'new_unit_price_usd' => $ei->new_unit_price_usd,
                    ]),
                ]),
                'delivery_confirmations' => $sale->deliveryConfirmations->map(fn ($confirmation) => [
                    'id' => $confirmation->id,
                    'confirmation_date' => $confirmation->confirmation_date?->toDateString(),
                    'status' => $confirmation->status,
                    'original_product_total_usd' => $confirmation->original_product_total_usd,
                    'final_product_total_usd' => $confirmation->final_product_total_usd,
                    'original_delivery_fee_usd' => $confirmation->original_delivery_fee_usd,
                    'final_delivery_fee_usd' => $confirmation->final_delivery_fee_usd,
                    'discount_usd' => $confirmation->discount_usd,
                    'final_total_usd' => $confirmation->final_total_usd,
                    'delivery_fee_note' => $confirmation->delivery_fee_note,
                    'note' => $confirmation->note,
                    'items' => $confirmation->items->map(fn ($item) => [
                        'id' => $item->id,
                        'sale_item_id' => $item->sale_item_id,
                        'original_qty' => $item->original_qty,
                        'accepted_qty' => $item->accepted_qty,
                        'rejected_qty' => $item->rejected_qty,
                        'added_qty' => $item->added_qty,
                        'unit_price_usd' => $item->unit_price_usd,
                        'final_total_usd' => $item->final_total_usd,
                        'action_type' => $item->action_type,
                        'original_variant' => [
                            'sku' => $item->originalVariant?->sku,
                            'product_name' => $item->originalVariant?->product?->name,
                            'color' => $item->originalVariant?->color,
                            'size' => $item->originalVariant?->size,
                        ],
                        'final_variant' => [
                            'sku' => $item->finalVariant?->sku,
                            'product_name' => $item->finalVariant?->product?->name,
                            'color' => $item->finalVariant?->color,
                            'size' => $item->finalVariant?->size,
                        ],
                    ]),
                ]),
            ],
        ]);
    }
}
