<?php

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\Sale;
use App\Models\StockBalance;
use App\Models\StockLayer;
use App\Models\StockMovement;
use App\Models\User;

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->actingAs($this->user);

    $category = Category::create([
        'name' => 'Shirt $6',
        'default_sale_price_usd' => 6.00,
    ]);

    $product = Product::create([
        'category_id' => $category->id,
        'name' => 'Hawai Blue',
    ]);

    $this->variant = ProductVariant::create([
        'product_id' => $product->id,
        'sku' => 'HAWAI-BLUE-M',
        'color' => 'Blue',
        'size' => 'M',
        'sale_price_usd' => 6.00,
    ]);

    $purchase = Purchase::create([
        'purchase_no' => 'PO-001',
        'purchase_date' => '2026-05-12',
        'currency' => 'USD',
        'exchange_rate' => 1,
        'status' => 'confirmed',
        'created_by' => $this->user->id,
    ]);

    $purchaseItem = PurchaseItem::create([
        'purchase_id' => $purchase->id,
        'category_id' => $category->id,
        'product_id' => $product->id,
        'product_variant_id' => $this->variant->id,
        'qty' => 100,
        'unit_cost_usd' => 2.03,
        'landed_unit_cost_usd' => 2.40,
        'sale_price_usd' => 6.00,
    ]);

    $this->layer = StockLayer::create([
        'purchase_item_id' => $purchaseItem->id,
        'product_variant_id' => $this->variant->id,
        'original_qty' => 100,
        'remaining_qty' => 100,
        'unit_cost_usd' => 2.40,
        'purchase_date' => '2026-05-12',
    ]);

    StockMovement::create([
        'product_variant_id' => $this->variant->id,
        'stock_layer_id' => $this->layer->id,
        'type' => 'purchase',
        'qty_change' => 100,
        'unit_cost_usd' => '2.40',
        'note' => 'Purchase #PO-001',
    ]);

    StockBalance::create([
        'product_variant_id' => $this->variant->id,
        'qty_on_hand' => 100,
    ]);
});

test('cancel sale restores stock and records movement', function () {
    $response = $this->post(route('sales.store'), [
        'sale_date' => '2026-05-13',
        'items' => [
            [
                'product_variant_id' => $this->variant->id,
                'qty' => 10,
                'unit_price_usd' => 10.00,
            ],
        ],
    ]);

    $response->assertRedirect();

    $this->assertDatabaseHas('stock_layers', [
        'id' => $this->layer->id,
        'remaining_qty' => 90,
    ]);

    $this->assertDatabaseHas('stock_balances', [
        'product_variant_id' => $this->variant->id,
        'qty_on_hand' => 90,
    ]);

    $sale = Sale::first();

    $cancelResponse = $this->post(route('sales.cancel', $sale));
    $cancelResponse->assertRedirect();

    $this->layer->refresh();
    expect($this->layer->remaining_qty)->toBe(100);

    $balance = StockBalance::where('product_variant_id', $this->variant->id)->first();
    expect($balance->qty_on_hand)->toBe(100);

    $this->assertDatabaseHas('stock_movements', [
        'product_variant_id' => $this->variant->id,
        'type' => 'sale_cancel',
        'qty_change' => 10,
    ]);

    $sale->refresh();
    expect($sale->order_status)->toBe('cancelled');
    expect($sale->payment_status)->toBe('cancelled');
});

test('cannot cancel already cancelled sale', function () {
    $response = $this->post(route('sales.store'), [
        'sale_date' => '2026-05-13',
        'items' => [
            [
                'product_variant_id' => $this->variant->id,
                'qty' => 5,
                'unit_price_usd' => 10.00,
            ],
        ],
    ]);

    $sale = Sale::first();
    $this->post(route('sales.cancel', $sale));

    $secondCancel = $this->post(route('sales.cancel', $sale));
    $secondCancel->assertSessionHasErrors();
});
