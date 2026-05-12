<?php

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

test('authenticated users can create a product with an image and variants', function () {
    Storage::fake('public');

    $user = User::factory()->create();
    $category = Category::factory()->create();

    $this->actingAs($user)
        ->post(route('products.store'), [
            'name' => 'Oversized Linen Shirt',
            'category_id' => $category->id,
            'description' => 'Lightweight summer shirt.',
            'status' => 'active',
            'image' => UploadedFile::fake()->image('linen-shirt.jpg'),
            'variants' => [
                [
                    'sku' => 'OVERSIZED-LINEN-NAVY-M',
                    'style_name' => 'Oversized',
                    'color' => 'Navy',
                    'size' => 'M',
                    'sale_price_usd' => '18.5000',
                ],
                [
                    'sku' => 'OVERSIZED-LINEN-NAVY-L',
                    'style_name' => 'Oversized',
                    'color' => 'Navy',
                    'size' => 'L',
                    'sale_price_usd' => '18.5000',
                ],
            ],
        ])
        ->assertRedirect(route('products.index'));

    $product = Product::query()->first();

    expect($product)->not->toBeNull();
    expect($product->name)->toBe('Oversized Linen Shirt');
    expect($product->image_path)->not->toBeNull();

    Storage::disk('public')->assertExists($product->image_path);

    expect(ProductVariant::query()->count())->toBe(2);

    $this->assertDatabaseHas('product_variants', [
        'product_id' => $product->id,
        'sku' => 'OVERSIZED-LINEN-NAVY-M',
        'size' => 'M',
    ]);
});

test('authenticated users can remove an existing product image', function () {
    Storage::fake('public');

    $user = User::factory()->create();
    $category = Category::factory()->create();

    $product = Product::create([
        'category_id' => $category->id,
        'name' => 'Cropped Tee',
        'description' => 'Short sleeve',
        'status' => 'active',
        'image_path' => UploadedFile::fake()->image('cropped-tee.jpg')->store('products', 'public'),
    ]);

    $this->actingAs($user)
        ->post(route('products.update', $product), [
            '_method' => 'patch',
            'name' => $product->name,
            'category_id' => $category->id,
            'description' => $product->description,
            'status' => 'active',
            'remove_image' => true,
        ])
        ->assertRedirect(route('products.index'));

    expect($product->fresh()->image_path)->toBeNull();
});
