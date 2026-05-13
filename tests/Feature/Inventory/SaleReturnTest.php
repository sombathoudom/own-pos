<?php

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\Sale;
use App\Models\SaleReturn;
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
        'status' => 'arrived',
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

test('partial return restores stock and records movement', function () {
    $this->post(route('sales.store'), [
        'sale_date' => '2026-05-13',
        'items' => [
            [
                'product_variant_id' => $this->variant->id,
                'qty' => 10,
                'unit_price_usd' => 10.00,
            ],
        ],
    ]);

    $sale = Sale::first();
    $sale->update(['delivery_completed_date' => '2026-05-13', 'order_status' => 'completed', 'paid_usd' => $sale->total_usd, 'payment_status' => 'paid']);

    $saleItem = $sale->items()->first();

    $response = $this->post(route('sales.return', $sale), [
        'returned_at' => '2026-05-14',
        'items' => [
            [
                'sale_item_id' => $saleItem->id,
                'qty' => 3,
            ],
        ],
        'note' => 'Customer changed mind',
    ]);

    $response->assertRedirect();

    $saleReturn = SaleReturn::first();
    if (! $saleReturn) {
        $errors = $response->getSession()->get('errors');
        if ($errors) {
            $this->fail('Return failed: '.implode(', ', $errors->all()));
        }
        $this->fail('No sale return created');
    }

    $this->layer->refresh();
    expect($this->layer->remaining_qty)->toBe(93);

    $balance = StockBalance::where('product_variant_id', $this->variant->id)->first();
    expect($balance->qty_on_hand)->toBe(93);

    $this->assertDatabaseHas('stock_movements', [
        'product_variant_id' => $this->variant->id,
        'type' => 'sale_return',
        'qty_change' => 3,
    ]);

    $saleReturn = SaleReturn::first();
    $this->assertDatabaseHas('sale_returns', [
        'sale_id' => $sale->id,
        'total_refund_usd' => '30.0000',
    ]);
    expect($saleReturn->payment_received_date?->toDateString())->toBe('2026-05-14');

    $sale->refresh();
    expect($sale->order_status)->toBe('partially_returned');
    expect($sale->payment_status)->toBe('paid');
    expect(bccomp($sale->paid_usd, $sale->total_usd, 4))->toBe(0);
});

test('full return updates sale status to returned', function () {
    $this->post(route('sales.store'), [
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
    $sale->update(['delivery_completed_date' => '2026-05-13', 'order_status' => 'completed', 'paid_usd' => $sale->total_usd, 'payment_status' => 'paid']);

    $this->post(route('sales.return', $sale), [
        'returned_at' => '2026-05-14',
        'items' => [
            [
                'sale_item_id' => $sale->items->first()->id,
                'qty' => 5,
            ],
        ],
    ])->assertRedirect();

    $sale->refresh();
    expect($sale->order_status)->toBe('returned');
    expect(bccomp($sale->paid_usd, '0', 4))->toBe(0);
});

test('cannot return more than sold qty', function () {
    $this->post(route('sales.store'), [
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
    $sale->update(['delivery_completed_date' => '2026-05-13', 'order_status' => 'completed']);

    $response = $this->post(route('sales.return', $sale), [
        'returned_at' => '2026-05-14',
        'items' => [
            [
                'sale_item_id' => $sale->items->first()->id,
                'qty' => 10,
            ],
        ],
    ]);

    $response->assertSessionHasErrors();
});
