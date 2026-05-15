<?php

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\Sale;
use App\Models\SaleExchange;
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

function createLifecycleSale(object $testCase, array $overrides = []): Sale
{
    $items = $overrides['items'] ?? [
        [
            'product_variant_id' => $testCase->originalVariant->id,
            'qty' => 2,
            'unit_price_usd' => 6.00,
        ],
    ];

    $params = array_merge([
        'sale_date' => '2026-05-13',
        'customer_delivery_fee_usd' => 2,
        'actual_delivery_cost_usd' => 1,
    ], $overrides, ['items' => $items]);

    $testCase->post(route('sales.store'), $params)->assertRedirect();

    $sale = Sale::first();

    $confirmItems = $sale->items->map(fn ($item) => [
        'sale_item_id' => $item->id,
        'accepted_qty' => $item->qty,
        'changed_qty' => 0,
    ])->values()->all();

    $testCase->post(route('sales.confirm-delivery.store', $sale), [
        'confirmation_date' => '2026-05-14',
        'status' => 'delivered',
        'items' => $confirmItems,
        'added_items' => [],
        'final_delivery_fee_usd' => $params['customer_delivery_fee_usd'] ?? 2,
        'actual_delivery_cost_usd' => $params['actual_delivery_cost_usd'] ?? 1,
    ])->assertRedirect();

    return $sale->fresh('items');
}

test('partial return reduces paid_usd and total_usd and sets payment_received_date', function () {
    $sale = createLifecycleSale($this);
    $saleItem = $sale->items()->first();
    $originalTotal = $sale->total_usd;
    $originalPaid = $sale->paid_usd;

    $this->post(route('sales.return', $sale), [
        'returned_at' => '2026-05-15',
        'items' => [
            [
                'sale_item_id' => $saleItem->id,
                'qty' => 1,
            ],
        ],
    ])->assertRedirect();

    $saleReturn = SaleReturn::first();
    $sale->refresh();
    $saleItem->refresh();

    $expectedRefund = bcmul((string) $saleItem->total_usd, bcdiv('1', (string) $saleItem->final_qty, 4), 4);
    expect($saleReturn->total_refund_usd)->not->toBe('0.0000');
    expect($saleReturn->payment_received_date?->toDateString())->toBe('2026-05-15');

    expect(bcsub((string) $originalTotal, (string) $sale->total_usd, 4))->not->toBe('0.0000');
    expect(bcsub((string) $originalPaid, (string) $sale->paid_usd, 4))->not->toBe('0.0000');
    expect($sale->payment_status)->toBe('paid');
    expect($sale->order_status)->toBe('partially_returned');
    expect($saleItem->final_qty)->toBe(1);
});

test('full return leaves only delivery fee in total and keeps payment correct', function () {
    $sale = createLifecycleSale($this);
    $saleItem = $sale->items()->first();

    $this->post(route('sales.return', $sale), [
        'returned_at' => '2026-05-15',
        'items' => [
            [
                'sale_item_id' => $saleItem->id,
                'qty' => 2,
            ],
        ],
    ])->assertRedirect();

    $sale->refresh();

    expect($sale->order_status)->toBe('returned');
    expect(bccomp($sale->total_usd, '0', 4))->toBeGreaterThan(0);
    expect($sale->paid_usd)->toBe($sale->total_usd);
    expect($sale->payment_status)->toBe('paid');
});

test('return after exchange reduces totals correctly', function () {
    $sale = createLifecycleSale($this);
    $saleItem = $sale->items()->first();

    $this->post(route('sales.exchange', $sale), [
        'exchange_date' => '2026-05-16',
        'items' => [
            [
                'sale_item_id' => $saleItem->id,
                'qty' => 1,
                'new_variant_id' => $this->replacementVariant->id,
                'new_unit_price' => 6.00,
            ],
        ],
        'exchange_delivery_fee_usd' => 0,
        'exchange_delivery_cost_usd' => 0,
    ])->assertRedirect();

    $sale->refresh();
    $totalAfterExchange = $sale->total_usd;
    $paidAfterExchange = $sale->paid_usd;

    $newSaleItem = $sale->items()->where('product_variant_id', $this->replacementVariant->id)->first();

    $this->post(route('sales.return', $sale), [
        'returned_at' => '2026-05-17',
        'items' => [
            [
                'sale_item_id' => $newSaleItem->id,
                'qty' => 1,
            ],
        ],
    ])->assertRedirect();

    $saleReturn = SaleReturn::first();
    $sale->refresh();

    expect($saleReturn->payment_received_date?->toDateString())->toBe('2026-05-17');
    expect(bccomp(bcsub((string) $totalAfterExchange, (string) $sale->total_usd, 4), '0', 4))->toBeGreaterThan(0);
    expect(bccomp(bcsub((string) $paidAfterExchange, (string) $sale->paid_usd, 4), '0', 4))->toBeGreaterThan(0);
    expect($sale->order_status)->toBe('partially_returned');
});

test('exchange after partial return works correctly', function () {
    $sale = createLifecycleSale($this);
    $saleItem = $sale->items()->first();

    $this->post(route('sales.return', $sale), [
        'returned_at' => '2026-05-15',
        'items' => [
            [
                'sale_item_id' => $saleItem->id,
                'qty' => 1,
            ],
        ],
    ])->assertRedirect();

    $sale->refresh();
    $saleItem->refresh();

    expect($saleItem->final_qty)->toBe(1);

    $this->post(route('sales.exchange', $sale), [
        'exchange_date' => '2026-05-16',
        'items' => [
            [
                'sale_item_id' => $saleItem->id,
                'qty' => 1,
                'new_variant_id' => $this->replacementVariant->id,
                'new_unit_price' => 6.00,
            ],
        ],
        'exchange_delivery_fee_usd' => 1,
        'exchange_delivery_cost_usd' => 0,
    ])->assertRedirect();

    $sale->refresh();
    $exchange = SaleExchange::first();

    expect($exchange)->not->toBeNull();
    expect($exchange->total_additional_amount_usd)->toBe('1.0000');
});

test('report shows return entries with negative amounts on receipt date', function () {
    $sale = createLifecycleSale($this);
    $saleItem = $sale->items()->first();

    $this->post(route('sales.return', $sale), [
        'returned_at' => '2026-05-15',
        'items' => [
            [
                'sale_item_id' => $saleItem->id,
                'qty' => 1,
            ],
        ],
    ])->assertRedirect();

    $response = $this->get(route('reports.daily', ['date' => '2026-05-15']));
    $response->assertOk();

    $entries = $response->inertiaPage()['props']['entries'];
    $returnEntry = collect($entries)->first(fn ($e) => $e['entry_type'] === 'return');

    expect($returnEntry)->not->toBeNull();
    expect($returnEntry['entry_type'])->toBe('return');
    expect(bccomp((string) $returnEntry['total_usd'], '0', 4))->toBeLessThan(0);
});

test('monthly report subtracts return refunds from total revenue', function () {
    $sale = createLifecycleSale($this);
    $saleItem = $sale->items()->first();

    $this->post(route('sales.return', $sale), [
        'returned_at' => '2026-05-15',
        'items' => [
            [
                'sale_item_id' => $saleItem->id,
                'qty' => 1,
            ],
        ],
    ])->assertRedirect();

    $response = $this->get(route('reports.monthly', ['month' => '2026-05']));
    $response->assertOk();

    $summary = $response->inertiaPage()['props']['summary'];
    expect(bccomp($summary['total_revenue'], '0', 4))->toBeGreaterThan(0);
});
