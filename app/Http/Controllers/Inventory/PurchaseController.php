<?php

namespace App\Http\Controllers\Inventory;

use App\Actions\Inventory\ReceivePurchase;
use App\Http\Controllers\Controller;
use App\Http\Requests\Inventory\StorePurchaseRequest;
use App\Models\Category;
use App\Models\Product;
use App\Models\Purchase;
use App\Models\Supplier;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class PurchaseController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->string('search')->toString();

        $purchases = Purchase::query()
            ->with('supplier', 'items.productVariant')
            ->when($search !== '', fn ($query) => $query->where('purchase_no', 'like', "%{$search}%"))
            ->orderByDesc('purchase_date')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('inventory/purchases/index', [
            'purchases' => $purchases,
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    public function create(): Response
    {
        $suppliers = Supplier::where('status', 'active')->orderBy('name')->get(['id', 'name']);
        $categories = Category::where('status', 'active')->orderBy('name')->get(['id', 'name']);
        $products = Product::where('status', 'active')
            ->with('variants:id,product_id,sku,color,size,sale_price_usd')
            ->orderBy('name')
            ->get(['id', 'name', 'category_id', 'image_path'])
            ->map(fn ($p) => [
                'id' => $p->id,
                'name' => $p->name,
                'category_id' => $p->category_id,
                'image_url' => $p->imageUrl(),
                'variants' => $p->variants,
            ]);

        return Inertia::render('inventory/purchases/create', [
            'suppliers' => $suppliers,
            'categories' => $categories,
            'products' => $products,
            'purchaseNo' => 'PO-'.now()->format('Ymd').'-'.Str::upper(Str::random(4)),
        ]);
    }

    public function store(StorePurchaseRequest $request, ReceivePurchase $receivePurchase): RedirectResponse
    {
        $validated = $request->validated();

        $purchase = Purchase::create([
            'supplier_id' => $validated['supplier_id'] ?? null,
            'purchase_no' => $validated['purchase_no'] ?? 'PO-'.now()->format('Ymd').'-'.Str::upper(Str::random(4)),
            'purchase_date' => $validated['purchase_date'],
            'arrival_date' => $validated['arrival_date'] ?? null,
            'currency' => $validated['currency'] ?? 'USD',
            'exchange_rate' => $validated['exchange_rate'] ?? 1,
            'purchase_delivery_cost_usd' => $validated['purchase_delivery_cost_usd'] ?? 0,
            'other_cost_usd' => $validated['other_cost_usd'] ?? 0,
            'status' => 'draft',
            'note' => $validated['note'] ?? null,
            'created_by' => $request->user()->id,
        ]);

        foreach ($validated['items'] as $itemData) {
            $purchase->items()->create([
                'category_id' => $itemData['category_id'],
                'product_id' => $itemData['product_id'],
                'product_variant_id' => $itemData['product_variant_id'],
                'qty' => $itemData['qty'],
                'unit_cost_usd' => $itemData['unit_cost_usd'],
                'subtotal_usd' => bcmul((string) $itemData['unit_cost_usd'], (string) $itemData['qty'], 4),
                'sale_price_usd' => $itemData['sale_price_usd'],
            ]);
        }

        $receivePurchase->handle($purchase);

        return to_route('purchases.show', $purchase)->with('toast', ['type' => 'success', 'message' => 'Purchase received and stock updated.']);
    }

    public function show(Purchase $purchase): Response
    {
        $purchase->load('supplier', 'items.category', 'items.product', 'items.productVariant', 'createdBy');

        return Inertia::render('inventory/purchases/show', [
            'purchase' => [
                'id' => $purchase->id,
                'purchase_no' => $purchase->purchase_no,
                'purchase_date' => $purchase->purchase_date?->toDateString(),
                'currency' => $purchase->currency,
                'exchange_rate' => $purchase->exchange_rate,
                'subtotal_usd' => $purchase->subtotal_usd,
                'purchase_delivery_cost_usd' => $purchase->purchase_delivery_cost_usd,
                'other_cost_usd' => $purchase->other_cost_usd,
                'total_cost_usd' => $purchase->total_cost_usd,
                'status' => $purchase->status,
                'note' => $purchase->note,
                'supplier' => $purchase->supplier,
                'createdBy' => $purchase->createdBy,
                'items' => $purchase->items->map(fn ($item) => [
                    'id' => $item->id,
                    'category_id' => $item->category_id,
                    'product_id' => $item->product_id,
                    'product_variant_id' => $item->product_variant_id,
                    'qty' => $item->qty,
                    'unit_cost_usd' => $item->unit_cost_usd,
                    'subtotal_usd' => $item->subtotal_usd,
                    'allocated_delivery_cost_usd' => $item->allocated_delivery_cost_usd,
                    'allocated_other_cost_usd' => $item->allocated_other_cost_usd,
                    'landed_unit_cost_usd' => $item->landed_unit_cost_usd,
                    'total_landed_cost_usd' => $item->total_landed_cost_usd,
                    'sale_price_usd' => $item->sale_price_usd,
                    'expected_profit_per_unit_usd' => $item->expected_profit_per_unit_usd,
                    'category' => $item->category,
                    'product' => $item->product,
                    'productVariant' => $item->productVariant,
                ])->values()->all(),
            ],
        ]);
    }
}
