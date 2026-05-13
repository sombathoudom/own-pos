<?php

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\Sale;
use App\Models\SaleExchange;
use App\Models\StockBalance;
use App\Models\StockLayer;
use App\Models\StockMovement;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

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

function createDeliveredSale(object $testCase): Sale
{
    $testCase->post(route('sales.store'), [
        'sale_date' => '2026-05-13',
        'customer_delivery_fee_usd' => 2,
        'actual_delivery_cost_usd' => 1,
        'items' => [
            [
                'product_variant_id' => $testCase->originalVariant->id,
                'qty' => 2,
                'unit_price_usd' => 6.00,
            ],
        ],
    ])->assertRedirect();

    $sale = Sale::first();
    $saleItem = $sale->items()->first();

    $testCase->post(route('sales.confirm-delivery.store', $sale), [
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

    return $sale->fresh('items');
}

test('size change after successful delivery keeps original receipt date and records later delivery fee receipt', function () {
    $sale = createDeliveredSale($this);
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
        'exchange_delivery_fee_usd' => 2,
        'exchange_delivery_cost_usd' => 1,
    ])->assertRedirect();

    $exchange = SaleExchange::first();
    $sale->refresh();

    expect($exchange->payment_received_date?->toDateString())->toBe('2026-05-16');
    expect($exchange->total_additional_amount_usd)->toBe('2.0000');
    expect($sale->paid_usd)->toBe('16.0000');
    expect($sale->payment_status)->toBe('paid');

    $this->get(route('reports.daily', ['date' => '2026-05-14']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('inventory/reports/daily')
            ->has('entries', 1)
            ->has('entries.0', fn (Assert $entry) => $entry
                ->where('invoice_no', $sale->invoice_no)
                ->where('total_usd', '14.0000')
                ->etc()
            )
        );

    $this->get(route('reports.daily', ['date' => '2026-05-16']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('inventory/reports/daily')
            ->has('entries', 1)
            ->has('entries.0', fn (Assert $entry) => $entry
                ->where('entry_type', 'exchange')
                ->where('total_usd', '2.0000')
                ->etc()
            )
        );
});

test('size change with extra item after successful delivery counts only extra later receipt in reports', function () {
    $sale = createDeliveredSale($this);
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
        'new_items' => [
            [
                'product_variant_id' => $this->addedVariant->id,
                'qty' => 1,
                'unit_price_usd' => 8.00,
            ],
        ],
        'exchange_delivery_fee_usd' => 2,
        'exchange_delivery_cost_usd' => 1,
    ])->assertRedirect();

    $exchange = SaleExchange::first();
    $sale->refresh();

    expect($exchange->total_additional_amount_usd)->toBe('10.0000');
    expect($exchange->new_items_subtotal_usd)->toBe('8.0000');
    expect($exchange->additional_qty_sold)->toBe(1);
    expect($sale->paid_usd)->toBe('24.0000');
    expect($sale->payment_status)->toBe('paid');

    $this->get(route('reports.monthly', ['month' => '2026-05']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('inventory/reports/monthly')
            ->where('summary.total_revenue', '24.0000')
            ->where('summary.total_qty_sold', 3)
        );
});
