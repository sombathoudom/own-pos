<?php

use App\Models\Category;
use App\Models\DailyClosing;
use App\Models\Expense;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Sale;
use App\Models\SaleExchange;
use App\Models\SaleItem;
use App\Models\SaleReturn;
use App\Models\StockBalance;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('guests are redirected to the login page', function () {
    $response = $this->get(route('dashboard'));
    $response->assertRedirect(route('login'));
});

test('authenticated users can visit the dashboard', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $response = $this->get(route('dashboard'));
    $response->assertOk();
});

test('dashboard shows key sales, stock, and payment metrics', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $today = now()->toDateString();
    $earlierThisMonth = now()->subDays(5)->toDateString();

    $category = Category::create([
        'name' => 'Shirts',
        'default_sale_price_usd' => 10,
    ]);

    $productA = Product::create([
        'category_id' => $category->id,
        'name' => 'Ocean Shirt',
        'status' => 'active',
    ]);

    $productB = Product::create([
        'category_id' => $category->id,
        'name' => 'Sunset Shirt',
        'status' => 'active',
    ]);

    $variantA = ProductVariant::create([
        'product_id' => $productA->id,
        'sku' => 'OCEAN-BLUE-L',
        'color' => 'Blue',
        'size' => 'L',
        'sale_price_usd' => 20,
        'status' => 'active',
    ]);

    $variantB = ProductVariant::create([
        'product_id' => $productB->id,
        'sku' => 'SUNSET-RED-M',
        'color' => 'Red',
        'size' => 'M',
        'sale_price_usd' => 40,
        'status' => 'active',
    ]);

    StockBalance::create([
        'product_variant_id' => $variantA->id,
        'qty_on_hand' => 4,
    ]);

    StockBalance::create([
        'product_variant_id' => $variantB->id,
        'qty_on_hand' => 0,
    ]);

    $saleToday = Sale::create([
        'invoice_no' => 'SAL-001',
        'customer_name' => 'Dara',
        'sale_date' => $today,
        'currency' => 'USD',
        'exchange_rate' => 1,
        'original_subtotal_usd' => 100,
        'subtotal_usd' => 120,
        'discount_usd' => 0,
        'original_delivery_fee_usd' => 20,
        'customer_delivery_fee_usd' => 20,
        'actual_delivery_cost_usd' => 5,
        'delivery_profit_usd' => 15,
        'original_total_usd' => 120,
        'total_usd' => 140,
        'paid_usd' => 140,
        'payment_received_date' => $today,
        'delivery_completed_date' => $today,
        'payment_status' => 'paid',
        'order_status' => 'completed',
        'created_by' => $user->id,
    ]);

    SaleItem::create([
        'sale_id' => $saleToday->id,
        'product_variant_id' => $variantA->id,
        'qty' => 5,
        'accepted_qty' => 5,
        'rejected_qty' => 0,
        'final_qty' => 5,
        'unit_price_usd' => 20,
        'discount_usd' => 0,
        'total_usd' => 100,
        'cogs_usd' => 50,
        'profit_usd' => 50,
        'status' => 'accepted',
    ]);

    SaleExchange::create([
        'sale_id' => $saleToday->id,
        'exchange_date' => $today,
        'payment_received_date' => $today,
        'exchange_delivery_fee_usd' => 0,
        'exchange_delivery_cost_usd' => 0,
        'subtotal_adjustment_usd' => 20,
        'new_items_subtotal_usd' => 0,
        'total_additional_amount_usd' => 20,
        'additional_cogs_usd' => 8,
        'additional_profit_usd' => 12,
        'additional_qty_sold' => 1,
        'created_by' => $user->id,
    ]);

    $saleEarlier = Sale::create([
        'invoice_no' => 'SAL-002',
        'customer_name' => 'Sokha',
        'sale_date' => $earlierThisMonth,
        'currency' => 'USD',
        'exchange_rate' => 1,
        'original_subtotal_usd' => 80,
        'subtotal_usd' => 80,
        'discount_usd' => 0,
        'original_delivery_fee_usd' => 0,
        'customer_delivery_fee_usd' => 0,
        'actual_delivery_cost_usd' => 0,
        'delivery_profit_usd' => 0,
        'original_total_usd' => 80,
        'total_usd' => 70,
        'paid_usd' => 70,
        'payment_received_date' => $earlierThisMonth,
        'delivery_completed_date' => $earlierThisMonth,
        'payment_status' => 'paid',
        'order_status' => 'completed',
        'created_by' => $user->id,
    ]);

    SaleItem::create([
        'sale_id' => $saleEarlier->id,
        'product_variant_id' => $variantB->id,
        'qty' => 2,
        'accepted_qty' => 2,
        'rejected_qty' => 0,
        'final_qty' => 2,
        'unit_price_usd' => 40,
        'discount_usd' => 0,
        'total_usd' => 80,
        'cogs_usd' => 40,
        'profit_usd' => 40,
        'status' => 'accepted',
    ]);

    SaleReturn::create([
        'sale_id' => $saleEarlier->id,
        'returned_at' => $today,
        'payment_received_date' => $today,
        'total_refund_usd' => 10,
        'created_by' => $user->id,
    ]);

    Sale::create([
        'invoice_no' => 'SAL-003',
        'customer_name' => 'Pich',
        'sale_date' => $today,
        'currency' => 'USD',
        'exchange_rate' => 1,
        'original_subtotal_usd' => 50,
        'subtotal_usd' => 50,
        'discount_usd' => 0,
        'original_delivery_fee_usd' => 0,
        'customer_delivery_fee_usd' => 0,
        'actual_delivery_cost_usd' => 0,
        'delivery_profit_usd' => 0,
        'original_total_usd' => 50,
        'total_usd' => 50,
        'paid_usd' => 20,
        'payment_status' => 'partial',
        'order_status' => 'confirmed',
        'created_by' => $user->id,
    ]);

    Expense::create([
        'expense_date' => $today,
        'category' => 'Fuel',
        'amount_usd' => 12,
        'amount_khr' => 48000,
        'currency' => 'USD',
        'exchange_rate' => 4000,
        'created_by' => $user->id,
    ]);

    DailyClosing::create([
        'closing_date' => $today,
        'total_orders' => 2,
        'completed_orders' => 2,
        'cancelled_orders' => 0,
        'returned_orders' => 1,
        'total_qty_sold' => 7,
        'gross_sales_usd' => 210,
        'discount_usd' => 0,
        'net_sales_usd' => 210,
        'total_cogs_usd' => 98,
        'gross_profit_usd' => 112,
        'total_expenses_usd' => 12,
        'net_profit_usd' => 100,
        'cash_usd' => 210,
        'cash_khr' => 0,
        'bank_usd' => 0,
        'unpaid_usd' => 30,
        'refund_usd' => 10,
        'closed_by' => $user->id,
        'closed_at' => now(),
        'status' => 'closed',
    ]);

    $this->get(route('dashboard'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('dashboard')
            ->where('summary.today_sales_usd', '130.00')
            ->where('summary.today_orders', 1)
            ->where('summary.month_sales_usd', '210.00')
            ->where('summary.total_sales_usd', '210.00')
            ->where('summary.outstanding_usd', '30.00')
            ->where('summary.low_stock_items', 2)
            ->where('summary.today_expenses_usd', '12.00')
            ->where('summary.today_closing_status', 'Closed')
            ->has('sales_trend', 7)
            ->where('sales_trend.6.sales_usd', '130.00')
            ->where('sales_trend.6.expenses_usd', '12.00')
            ->where('payment_breakdown.0.status', 'paid')
            ->where('payment_breakdown.0.total', 2)
            ->where('top_products.0.product_name', 'Ocean Shirt')
            ->where('top_products.0.qty_sold', 5)
            ->where('top_products.1.product_name', 'Sunset Shirt')
            ->where('recent_sales.0.invoice_no', 'SAL-001')
            ->where('low_stock_watchlist.0.qty_on_hand', 0)
        );
});
