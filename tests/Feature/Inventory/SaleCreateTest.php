<?php

use App\Models\Category;
use App\Models\Customer;
use App\Models\DeliveryCompany;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\Sale;
use App\Models\StockBalance;
use App\Models\StockLayer;
use App\Models\StockMovement;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->user = User::factory()->create();

    $this->category = Category::create([
        'name' => 'Shirt $6',
        'default_sale_price_usd' => 6.00,
    ]);

    $this->product = Product::create([
        'category_id' => $this->category->id,
        'name' => 'Hawai Blue',
    ]);

    $this->variant = ProductVariant::create([
        'product_id' => $this->product->id,
        'sku' => 'HAWAI-BLUE-M',
        'color' => 'Blue',
        'size' => 'M',
        'sale_price_usd' => 6.00,
    ]);

    // Create a purchase and stock layer so we have stock to sell
    $purchase = Purchase::create([
        'purchase_no' => 'PO-001',
        'purchase_date' => '2026-05-12',
        'currency' => 'USD',
        'exchange_rate' => 1,
        'status' => 'arrived',
        'created_by' => $this->user->id,
    ]);

    $this->purchaseItem = PurchaseItem::create([
        'purchase_id' => $purchase->id,
        'category_id' => $this->category->id,
        'product_id' => $this->product->id,
        'product_variant_id' => $this->variant->id,
        'qty' => 100,
        'unit_cost_usd' => 2.03,
        'landed_unit_cost_usd' => 2.40,
        'sale_price_usd' => 6.00,
    ]);

    StockLayer::create([
        'purchase_item_id' => $this->purchaseItem->id,
        'product_variant_id' => $this->variant->id,
        'original_qty' => 100,
        'remaining_qty' => 100,
        'unit_cost_usd' => 2.40,
        'purchase_date' => '2026-05-12',
    ]);

    StockMovement::create([
        'product_variant_id' => $this->variant->id,
        'stock_layer_id' => 1,
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

test('authenticated user can create a sale with fifo deduction', function () {
    $response = $this->actingAs($this->user)->post(route('sales.store'), [
        'sale_date' => '2026-05-13',
        'source_page' => 'DL',
        'currency' => 'USD',
        'exchange_rate' => 1,
        'discount_usd' => 0,
        'customer_delivery_fee_usd' => 0,
        'actual_delivery_cost_usd' => 0,
        'paid_usd' => 30,
        'note' => 'Test sale',
        'items' => [
            [
                'product_variant_id' => $this->variant->id,
                'qty' => 5,
                'unit_price_usd' => 6.50,
                'discount_usd' => 0,
            ],
        ],
    ]);

    $response->assertRedirect();

    $this->assertDatabaseHas('sales', [
        'customer_id' => null,
        'source_page' => 'DL',
        'total_usd' => '32.5000',
        'total_khr' => '133250.0000',
        'paid_usd' => '30.0000',
        'payment_status' => 'partial',
        'order_status' => 'confirmed',
    ]);

    $this->assertDatabaseHas('sale_items', [
        'qty' => 5,
        'unit_price_usd' => '6.5000',
        'total_usd' => '32.5000',
        'cogs_usd' => '12.0000',
        'profit_usd' => '20.5000',
    ]);

    $this->assertDatabaseHas('sale_item_cost_layers', [
        'qty' => 5,
        'unit_cost_usd' => '2.4000',
        'total_cost_usd' => '12.0000',
    ]);

    $this->assertDatabaseHas('stock_movements', [
        'product_variant_id' => $this->variant->id,
        'type' => 'sale',
        'qty_change' => -5,
    ]);

    $this->assertDatabaseHas('stock_layers', [
        'product_variant_id' => $this->variant->id,
        'remaining_qty' => 95,
    ]);

    $this->assertDatabaseHas('stock_balances', [
        'product_variant_id' => $this->variant->id,
        'qty_on_hand' => 95,
    ]);
});

test('sale source page must be a supported value', function () {
    $response = $this->actingAs($this->user)->post(route('sales.store'), [
        'sale_date' => '2026-05-13',
        'source_page' => 'Facebook',
        'items' => [
            [
                'product_variant_id' => $this->variant->id,
                'qty' => 1,
                'unit_price_usd' => 6.50,
            ],
        ],
    ]);

    $response->assertSessionHasErrors(['source_page']);
});

test('sale fails when stock is insufficient', function () {
    $response = $this->actingAs($this->user)->post(route('sales.store'), [
        'sale_date' => '2026-05-13',
        'items' => [
            [
                'product_variant_id' => $this->variant->id,
                'qty' => 500,
                'unit_price_usd' => 6.50,
            ],
        ],
    ]);

    $response->assertSessionHasErrors(['items']);
});

test('sale show includes delivery company name', function () {
    $deliveryCompany = DeliveryCompany::create([
        'name' => 'J&T Express',
        'delivery_cost_usd' => 1.50,
        'status' => 'active',
    ]);

    $this->actingAs($this->user)->post(route('sales.store'), [
        'sale_date' => '2026-05-13',
        'source_page' => 'DL',
        'delivery_company_id' => $deliveryCompany->id,
        'currency' => 'USD',
        'exchange_rate' => 1,
        'discount_usd' => 0,
        'customer_delivery_fee_usd' => 2,
        'actual_delivery_cost_usd' => 1.5,
        'paid_usd' => 14,
        'items' => [
            [
                'product_variant_id' => $this->variant->id,
                'qty' => 2,
                'unit_price_usd' => 6,
                'discount_usd' => 0,
            ],
        ],
    ])->assertRedirect();

    $sale = Sale::firstOrFail();

    $this->actingAs($this->user)
        ->get(route('sales.show', $sale))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('inventory/sales/show')
            ->where('sale.delivery_company.name', 'J&T Express')
        );
});

test('sales create and pos pages include active customers for searchable selection', function () {
    $customer = Customer::factory()->create([
        'name' => 'Searchable Customer',
        'status' => 'active',
    ]);

    $this->actingAs($this->user)
        ->get(route('sales.create'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('inventory/sales/create')
            ->where('customers.0.id', $customer->id)
            ->where('customers.0.name', 'Searchable Customer')
        );

    $this->actingAs($this->user)
        ->get(route('pos'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('inventory/pos/index')
            ->where('customers.0.id', $customer->id)
            ->where('customers.0.name', 'Searchable Customer')
        );
});

test('sale can be created for an existing customer', function () {
    $customer = Customer::factory()->create();

    $this->actingAs($this->user)
        ->post(route('sales.store'), [
            'customer_id' => $customer->id,
            'sale_date' => '2026-05-13',
            'source_page' => 'Walk-in',
            'currency' => 'USD',
            'exchange_rate' => 4100,
            'discount_usd' => 0,
            'customer_delivery_fee_usd' => 0,
            'actual_delivery_cost_usd' => 0,
            'paid_usd' => 6,
            'items' => [
                [
                    'product_variant_id' => $this->variant->id,
                    'qty' => 1,
                    'unit_price_usd' => 6,
                    'discount_usd' => 0,
                ],
            ],
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('sales', [
        'customer_id' => $customer->id,
        'total_usd' => '6.0000',
        'total_khr' => '24600.0000',
    ]);
});

test('sale edit can update the delivery company', function () {
    $firstCompany = DeliveryCompany::create([
        'name' => 'First Delivery',
        'delivery_cost_usd' => 1.00,
        'status' => 'active',
    ]);

    $secondCompany = DeliveryCompany::create([
        'name' => 'Second Delivery',
        'delivery_cost_usd' => 2.00,
        'status' => 'active',
    ]);

    $this->actingAs($this->user)->post(route('sales.store'), [
        'sale_date' => '2026-05-13',
        'source_page' => 'DL',
        'delivery_company_id' => $firstCompany->id,
        'currency' => 'USD',
        'exchange_rate' => 4100,
        'discount_usd' => 0,
        'customer_delivery_fee_usd' => 2,
        'actual_delivery_cost_usd' => 1,
        'paid_usd' => 8,
        'items' => [
            [
                'product_variant_id' => $this->variant->id,
                'qty' => 1,
                'unit_price_usd' => 6,
                'discount_usd' => 0,
            ],
        ],
    ])->assertRedirect();

    $sale = Sale::firstOrFail();

    $this->actingAs($this->user)
        ->put(route('sales.update', $sale), [
            'customer_id' => null,
            'source_page' => 'DL',
            'delivery_company_id' => $secondCompany->id,
            'sale_date' => '2026-05-13',
            'currency' => 'USD',
            'exchange_rate' => 4100,
            'discount_usd' => 0,
            'customer_delivery_fee_usd' => 2,
            'actual_delivery_cost_usd' => 1,
            'paid_usd' => 8,
            'note' => '',
            'items' => [
                [
                    'product_variant_id' => $this->variant->id,
                    'qty' => 1,
                    'unit_price_usd' => 6,
                    'discount_usd' => 0,
                ],
            ],
        ])
        ->assertRedirect(route('sales.show', $sale));

    $this->assertDatabaseHas('sales', [
        'id' => $sale->id,
        'delivery_company_id' => $secondCompany->id,
    ]);
});
