<?php

use App\Models\Category;
use App\Models\Expense;
use App\Models\OrderDelivery;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Purchase;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->actingAs($this->user);

    $category = Category::create([
        'name' => 'Shirts',
        'default_sale_price_usd' => 6,
    ]);

    $product = Product::create([
        'category_id' => $category->id,
        'name' => 'Blue Shirt',
        'status' => 'active',
    ]);

    $this->variant = ProductVariant::create([
        'product_id' => $product->id,
        'sku' => 'BLUE-SHIRT-L',
        'color' => 'Blue',
        'size' => 'L',
        'sale_price_usd' => 6,
        'status' => 'active',
    ]);
});

test('daily report exposes summary expense and courier breakdown', function () {
    $sale = Sale::create([
        'invoice_no' => 'SAL-001',
        'customer_name' => 'Dara',
        'source_page' => 'DL',
        'sale_date' => '2026-05-14',
        'currency' => 'USD',
        'exchange_rate' => 1,
        'original_subtotal_usd' => 12,
        'subtotal_usd' => 12,
        'discount_usd' => 0,
        'original_delivery_fee_usd' => 2,
        'customer_delivery_fee_usd' => 2,
        'actual_delivery_cost_usd' => 1.25,
        'delivery_profit_usd' => 0.75,
        'original_total_usd' => 14,
        'total_usd' => 14,
        'paid_usd' => 14,
        'payment_received_date' => '2026-05-14',
        'delivery_completed_date' => '2026-05-14',
        'payment_status' => 'paid',
        'order_status' => 'completed',
        'created_by' => $this->user->id,
    ]);

    SaleItem::create([
        'sale_id' => $sale->id,
        'product_variant_id' => $this->variant->id,
        'qty' => 2,
        'accepted_qty' => 2,
        'rejected_qty' => 0,
        'final_qty' => 2,
        'unit_price_usd' => 6,
        'discount_usd' => 0,
        'total_usd' => 12,
        'cogs_usd' => 4.2,
        'profit_usd' => 7.8,
        'status' => 'accepted',
    ]);

    OrderDelivery::create([
        'sale_id' => $sale->id,
        'delivery_company' => 'VET',
        'customer_delivery_fee_usd' => 2,
        'actual_delivery_cost_usd' => 1.25,
        'delivery_profit_usd' => 0.75,
        'delivery_status' => 'delivered',
    ]);

    Expense::create([
        'expense_date' => '2026-05-14',
        'category' => 'Boost',
        'amount_usd' => 1.50,
        'amount_khr' => 6000,
        'currency' => 'USD',
        'exchange_rate' => 4000,
        'created_by' => $this->user->id,
    ]);

    $this->get(route('reports.daily', ['date' => '2026-05-14']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('inventory/reports/daily')
            ->where('summary.orders_count', 1)
            ->where('summary.product_total_usd', '12.0000')
            ->where('summary.price_pack_usd', '14.0000')
            ->where('summary.gross_profit_usd', '8.5500')
            ->where('summary.boost_expense_usd', '1.5000')
            ->where('summary.net_profit_usd', '7.0500')
            ->where('expense_breakdown.0.category', 'Boost')
            ->where('courier_breakdown.0.company', 'VET')
            ->where('source_breakdown.0.source_page', 'DL')
            ->where('entries.0.price_mix', '$6.00 x 2')
        );
});

test('monthly report exposes daily ledger and purchase breakdown', function () {
    $sale = Sale::create([
        'invoice_no' => 'SAL-001',
        'customer_name' => 'Dara',
        'source_page' => 'DC',
        'sale_date' => '2026-05-14',
        'currency' => 'USD',
        'exchange_rate' => 1,
        'original_subtotal_usd' => 12,
        'subtotal_usd' => 12,
        'discount_usd' => 0,
        'original_delivery_fee_usd' => 2,
        'customer_delivery_fee_usd' => 2,
        'actual_delivery_cost_usd' => 1.25,
        'delivery_profit_usd' => 0.75,
        'original_total_usd' => 14,
        'total_usd' => 14,
        'paid_usd' => 14,
        'payment_received_date' => '2026-05-14',
        'delivery_completed_date' => '2026-05-14',
        'payment_status' => 'paid',
        'order_status' => 'completed',
        'created_by' => $this->user->id,
    ]);

    SaleItem::create([
        'sale_id' => $sale->id,
        'product_variant_id' => $this->variant->id,
        'qty' => 2,
        'accepted_qty' => 2,
        'rejected_qty' => 0,
        'final_qty' => 2,
        'unit_price_usd' => 6,
        'discount_usd' => 0,
        'total_usd' => 12,
        'cogs_usd' => 4.2,
        'profit_usd' => 7.8,
        'status' => 'accepted',
    ]);

    Expense::create([
        'expense_date' => '2026-05-14',
        'category' => 'Salary',
        'amount_usd' => 5,
        'amount_khr' => 20000,
        'currency' => 'USD',
        'exchange_rate' => 4000,
        'created_by' => $this->user->id,
    ]);

    Purchase::create([
        'purchase_no' => 'PO-001',
        'purchase_date' => '2026-05-10',
        'arrival_date' => '2026-05-12',
        'currency' => 'USD',
        'exchange_rate' => 1,
        'subtotal_usd' => 50,
        'purchase_delivery_cost_usd' => 5,
        'other_cost_usd' => 0,
        'total_cost_usd' => 55,
        'status' => 'arrived',
        'created_by' => $this->user->id,
    ]);

    $this->get(route('reports.monthly', ['month' => '2026-05']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('inventory/reports/monthly')
            ->where('summary.total_revenue', '14.0000')
            ->where('summary.net_profit', '3.5500')
            ->where('daily_ledger.0.date', '2026-05-14')
            ->where('daily_ledger.0.net_profit_usd', '3.5500')
            ->where('expense_breakdown.0.category', 'Salary')
            ->where('purchase_breakdown.0.purchase_no', 'PO-001')
            ->where('source_breakdown.0.source_page', 'DC')
        );
});
