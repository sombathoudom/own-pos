<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Http\Requests\Inventory\StoreProductRequest;
use App\Http\Requests\Inventory\UpdateProductRequest;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->string('search')->toString();

        $products = Product::query()
            ->with(['category:id,name', 'variants.stockBalance'])
            ->when($search !== '', fn ($query) => $query->where('name', 'like', "%{$search}%"))
            ->orderBy('name')
            ->paginate(20)
            ->withQueryString()
            ->through(fn (Product $product) => [
                'id' => $product->id,
                'category_id' => $product->category_id,
                'name' => $product->name,
                'description' => $product->description,
                'status' => $product->status,
                'image_url' => $product->imageUrl(),
                'category' => $product->category,
                'variants' => $product->variants->map(fn ($variant) => [
                    'id' => $variant->id,
                    'product_id' => $variant->product_id,
                    'sku' => $variant->sku,
                    'style_name' => $variant->style_name,
                    'color' => $variant->color,
                    'size' => $variant->size,
                    'sale_price_usd' => $variant->sale_price_usd,
                    'status' => $variant->status,
                    'stockBalance' => $variant->stockBalance,
                ])->values()->all(),
            ]);

        return Inertia::render('inventory/products/index', [
            'products' => $products,
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    public function create(): Response
    {
        $categories = Category::where('status', 'active')->orderBy('name')->get(['id', 'name']);

        return Inertia::render('inventory/products/create', [
            'categories' => $categories,
        ]);
    }

    public function store(StoreProductRequest $request): RedirectResponse
    {
        DB::transaction(function () use ($request): void {
            $validated = $request->validated();
            $variants = $validated['variants'];
            unset($validated['variants'], $validated['image']);

            $product = Product::create([
                ...$validated,
                'image_path' => $request->file('image')?->store('products', 'public'),
            ]);

            foreach ($variants as $variantData) {
                $product->variants()->create($variantData);
            }
        });

        return to_route('products.index')->with('toast', ['type' => 'success', 'message' => 'Product created.']);
    }

    public function edit(Product $product): Response
    {
        $product->load('variants');
        $categories = Category::where('status', 'active')->orderBy('name')->get(['id', 'name']);

        return Inertia::render('inventory/products/edit', [
            'product' => [
                'id' => $product->id,
                'category_id' => $product->category_id,
                'name' => $product->name,
                'description' => $product->description,
                'status' => $product->status,
                'image_url' => $product->imageUrl(),
                'variants' => $product->variants,
            ],
            'categories' => $categories,
        ]);
    }

    public function update(UpdateProductRequest $request, Product $product): RedirectResponse
    {
        DB::transaction(function () use ($request, $product): void {
            $validated = $request->validated();
            $removeImage = (bool) ($validated['remove_image'] ?? false);
            unset($validated['image'], $validated['remove_image']);

            if ($removeImage && $product->image_path) {
                Storage::disk('public')->delete($product->image_path);
                $validated['image_path'] = null;
            }

            if ($request->hasFile('image')) {
                if ($product->image_path) {
                    Storage::disk('public')->delete($product->image_path);
                }

                $validated['image_path'] = $request->file('image')->store('products', 'public');
            }

            $product->update($validated);
        });

        return to_route('products.index')->with('toast', ['type' => 'success', 'message' => 'Product updated.']);
    }

    public function destroy(Product $product): RedirectResponse
    {
        $product->delete();

        return to_route('products.index')->with('toast', ['type' => 'success', 'message' => 'Product deleted.']);
    }
}
