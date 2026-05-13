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

    $premiumProduct = Product::create([
        'category_id' => $category->id,
        'name' => 'Premium Flower',
    ]);

    $this->originalVariant = ProductVariant::create([
        'product_id' => $product->id,
        'sku' => 'HAWAI-BLUE-XL',
        'color' => 'Blue',
        'size' => 'XL',
        'sale_price_usd' => 6.00,
    ]);

    $this->replacementVariant = ProductVariant::create([
        'product_id' => $product->id,
        'sku' => 'HAWAI-BLACK-2XL',
        'color' => 'Black',
        'size' => '2XL',
        'sale_price_usd' => 6.00,
    ]);

    $this->addedVariant = ProductVariant::create([
        'product_id' => $premiumProduct->id,
        'sku' => 'PREMIUM-FLOWER-L',
        'color' => 'Flower',
        'size' => 'L',
        'sale_price_usd' => 8.00,
    ]);

    $purchase = Purchase::create([
        'purchase_no' => 'PO-001',
        'purchase_date' => '2026-05-12',
        'currency' => 'USD',
        'exchange_rate' => 1,
        'status' => 'arrived',
        'created_by' => $this->user->id,
    ]);

    collect([
        [$this->originalVariant, 100, 2.40],
        [$this->replacementVariant, 50, 2.40],
        [$this->addedVariant, 30, 3.60],
    ])->each(function (array $definition) use ($purchase, $category): void {
        [$variant, $qty, $landedCost] = $definition;

        $purchaseItem = PurchaseItem::create([
            'purchase_id' => $purchase->id,
            'category_id' => $category->id,
            'product_id' => $variant->product_id,
            'product_variant_id' => $variant->id,
            'qty' => $qty,
            'unit_cost_usd' => $landedCost,
            'landed_unit_cost_usd' => $landedCost,
            'sale_price_usd' => $variant->sale_price_usd,
        ]);

        $layer = StockLayer::create([
            'purchase_item_id' => $purchaseItem->id,
            'product_variant_id' => $variant->id,
            'original_qty' => $qty,
            'remaining_qty' => $qty,
            'unit_cost_usd' => $landedCost,
            'purchase_date' => '2026-05-12',
        ]);

        StockMovement::create([
            'product_variant_id' => $variant->id,
            'stock_layer_id' => $layer->id,
            'type' => 'purchase',
            'qty_change' => $qty,
            'unit_cost_usd' => (string) $landedCost,
            'note' => 'Purchase #PO-001',
        ]);

        StockBalance::create([
            'product_variant_id' => $variant->id,
            'qty_on_hand' => $qty,
        ]);
    });
});

test('delivery confirmation finalizes accepted changed and added items', function () {
    $this->post(route('sales.store'), [
        'sale_date' => '2026-05-13',
        'customer_delivery_fee_usd' => 2,
        'actual_delivery_cost_usd' => 2,
        'items' => [
            [
                'product_variant_id' => $this->originalVariant->id,
                'qty' => 4,
                'unit_price_usd' => 6.00,
            ],
        ],
    ])->assertRedirect();

    $sale = Sale::first();
    $saleItem = $sale->items()->first();

    $this->post(route('sales.confirm-delivery.store', $sale), [
        'confirmation_date' => '2026-05-14',
        'status' => 'changed_items',
        'items' => [
            [
                'sale_item_id' => $saleItem->id,
                'accepted_qty' => 2,
                'changed_qty' => 1,
                'new_variant_id' => $this->replacementVariant->id,
                'new_unit_price' => 6.00,
            ],
        ],
        'added_items' => [
            [
                'product_variant_id' => $this->addedVariant->id,
                'qty' => 1,
                'unit_price_usd' => 8.00,
            ],
        ],
        'final_delivery_fee_usd' => 2,
        'actual_delivery_cost_usd' => 2,
        'note' => 'Customer changed one item and added one extra.',
    ])->assertRedirect();

    $sale->refresh();
    $saleItem->refresh();

    expect($sale->subtotal_usd)->toBe('26.0000');
    expect($sale->total_usd)->toBe('28.0000');
    expect($sale->order_status)->toBe('completed');
    expect($sale->paid_usd)->toBe('28.0000');
    expect($sale->payment_status)->toBe('paid');
    expect($sale->payment_received_date?->toDateString())->toBe('2026-05-14');
    expect($sale->delivery_completed_date?->toDateString())->toBe('2026-05-14');

    expect($saleItem->status)->toBe('changed');
    expect($saleItem->final_qty)->toBe(2);
    expect($saleItem->rejected_qty)->toBe(2);
    expect($saleItem->total_usd)->toBe('12.0000');
    expect($saleItem->cogs_usd)->toBe('4.8000');

    $this->assertDatabaseHas('delivery_confirmations', [
        'sale_id' => $sale->id,
        'status' => 'changed_items',
        'final_product_total_usd' => '26.0000',
        'final_total_usd' => '28.0000',
    ]);

    $this->assertDatabaseHas('delivery_confirmation_items', [
        'sale_item_id' => $saleItem->id,
        'action_type' => 'changed',
        'accepted_qty' => 1,
    ]);

    $this->assertDatabaseHas('stock_movements', [
        'product_variant_id' => $this->originalVariant->id,
        'type' => 'delivery_rejected_return',
        'qty_change' => 1,
    ]);

    $this->assertDatabaseHas('stock_movements', [
        'product_variant_id' => $this->originalVariant->id,
        'type' => 'delivery_change_in',
        'qty_change' => 1,
    ]);

    $this->assertDatabaseHas('stock_movements', [
        'product_variant_id' => $this->replacementVariant->id,
        'type' => 'delivery_change_out',
        'qty_change' => -1,
    ]);

    $this->assertDatabaseHas('stock_movements', [
        'product_variant_id' => $this->addedVariant->id,
        'type' => 'delivery_added_item',
        'qty_change' => -1,
    ]);

    $this->assertDatabaseHas('stock_balances', [
        'product_variant_id' => $this->originalVariant->id,
        'qty_on_hand' => 98,
    ]);

    $this->assertDatabaseHas('stock_balances', [
        'product_variant_id' => $this->replacementVariant->id,
        'qty_on_hand' => 49,
    ]);

    $this->assertDatabaseHas('stock_balances', [
        'product_variant_id' => $this->addedVariant->id,
        'qty_on_hand' => 29,
    ]);
});

test('sale return is blocked until delivery is confirmed', function () {
    $this->post(route('sales.store'), [
        'sale_date' => '2026-05-13',
        'items' => [
            [
                'product_variant_id' => $this->originalVariant->id,
                'qty' => 2,
                'unit_price_usd' => 6.00,
            ],
        ],
    ])->assertRedirect();

    $sale = Sale::first();
    $saleItem = $sale->items()->first();

    $response = $this->post(route('sales.return', $sale), [
        'returned_at' => '2026-05-14',
        'items' => [
            [
                'sale_item_id' => $saleItem->id,
                'qty' => 1,
            ],
        ],
    ]);

    $response->assertSessionHasErrors(['general']);
});

test('delivery confirmation accepts unchanged delivered order', function () {
    $this->post(route('sales.store'), [
        'sale_date' => '2026-05-13',
        'customer_delivery_fee_usd' => 2,
        'actual_delivery_cost_usd' => 1,
        'items' => [
            [
                'product_variant_id' => $this->originalVariant->id,
                'qty' => 2,
                'unit_price_usd' => 6.00,
            ],
        ],
    ])->assertRedirect();

    $sale = Sale::first();
    $saleItem = $sale->items()->first();

    $this->post(route('sales.confirm-delivery.store', $sale), [
        'confirmation_date' => '2026-05-14',
        'status' => 'delivered',
        'items' => [
            [
                'sale_item_id' => $saleItem->id,
                'accepted_qty' => 2,
                'changed_qty' => 0,
            ],
        ],
        'added_items' => [],
        'final_delivery_fee_usd' => 2,
        'actual_delivery_cost_usd' => 1,
    ])->assertRedirect();

    $sale->refresh();
    $saleItem->refresh();

    expect($sale->order_status)->toBe('completed');
    expect($sale->paid_usd)->toBe('14.0000');
    expect($sale->payment_status)->toBe('paid');
    expect($sale->payment_received_date?->toDateString())->toBe('2026-05-14');
    expect($sale->delivery_completed_date?->toDateString())->toBe('2026-05-14');
    expect($saleItem->status)->toBe('accepted');
    expect($saleItem->final_qty)->toBe(2);

    $this->assertDatabaseHas('delivery_confirmations', [
        'sale_id' => $sale->id,
        'status' => 'delivered',
        'final_product_total_usd' => '12.0000',
        'final_total_usd' => '14.0000',
    ]);
});

test('failed delivery does not mark sale as paid', function () {
    $this->post(route('sales.store'), [
        'sale_date' => '2026-05-13',
        'customer_delivery_fee_usd' => 2,
        'actual_delivery_cost_usd' => 1,
        'items' => [
            [
                'product_variant_id' => $this->originalVariant->id,
                'qty' => 2,
                'unit_price_usd' => 6.00,
            ],
        ],
    ])->assertRedirect();

    $sale = Sale::first();
    $saleItem = $sale->items()->first();

    $this->post(route('sales.confirm-delivery.store', $sale), [
        'confirmation_date' => '2026-05-14',
        'status' => 'failed_delivery',
        'items' => [
            [
                'sale_item_id' => $saleItem->id,
                'accepted_qty' => 0,
                'changed_qty' => 0,
            ],
        ],
        'added_items' => [],
        'final_delivery_fee_usd' => 0,
        'actual_delivery_cost_usd' => 1,
    ])->assertRedirect();

    $sale->refresh();

    expect($sale->paid_usd)->toBe('0.0000');
    expect($sale->payment_status)->toBe('unpaid');
    expect($sale->payment_received_date)->toBeNull();
});
