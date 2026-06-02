<?php

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\StockAdjustment;
use App\Models\StockBalance;
use App\Models\StockCount;
use App\Models\StockLayer;
use App\Models\StockMovement;
use App\Models\User;

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->actingAs($this->user);

    $category = Category::create([
        'name' => 'Adjustment Test',
        'default_sale_price_usd' => 6,
    ]);

    $product = Product::create([
        'category_id' => $category->id,
        'name' => 'Sea Blue',
    ]);

    $this->variant = ProductVariant::create([
        'product_id' => $product->id,
        'sku' => 'SEA-BLUE-M',
        'size' => 'M',
        'sale_price_usd' => 6,
        'status' => 'active',
    ]);

    $layer = StockLayer::create([
        'purchase_item_id' => null,
        'product_variant_id' => $this->variant->id,
        'original_qty' => 1,
        'remaining_qty' => 1,
        'unit_cost_usd' => '2.0000',
        'purchase_date' => '2026-06-01',
    ]);

    StockMovement::create([
        'product_variant_id' => $this->variant->id,
        'stock_layer_id' => $layer->id,
        'type' => 'purchase',
        'qty_change' => 1,
        'unit_cost_usd' => '2.0000',
        'note' => 'Initial stock',
        'created_by' => $this->user->id,
    ]);

    StockBalance::create([
        'product_variant_id' => $this->variant->id,
        'qty_on_hand' => 1,
    ]);
});

test('approving stock adjustment out records negative movement and zeroes stock', function () {
    $adjustment = StockAdjustment::create([
        'adjustment_date' => '2026-06-02',
        'reason' => 'Manual recount',
        'created_by' => $this->user->id,
    ]);

    $adjustment->items()->create([
        'product_variant_id' => $this->variant->id,
        'system_qty' => 1,
        'actual_qty' => 0,
        'difference_qty' => -1,
        'movement_type' => 'adjustment_out',
    ]);

    $this->post(route('stock-adjustments.approve', $adjustment))
        ->assertRedirect(route('stock-adjustments.index'));

    $this->assertDatabaseHas('stock_movements', [
        'product_variant_id' => $this->variant->id,
        'type' => 'adjustment_out',
        'qty_change' => -1,
        'reference_id' => $adjustment->id,
    ]);

    $this->assertDatabaseHas('stock_balances', [
        'product_variant_id' => $this->variant->id,
        'qty_on_hand' => 0,
    ]);
});

test('approving stock count out records negative movement and zeroes stock', function () {
    $count = StockCount::create([
        'count_date' => '2026-06-02',
        'status' => 'draft',
        'counted_by' => $this->user->id,
    ]);

    $count->items()->create([
        'product_variant_id' => $this->variant->id,
        'system_qty' => 1,
        'actual_qty' => 0,
        'difference_qty' => -1,
    ]);

    $this->post(route('stock-counts.approve', $count))
        ->assertRedirect(route('stock-counts.index'));

    $this->assertDatabaseHas('stock_movements', [
        'product_variant_id' => $this->variant->id,
        'type' => 'adjustment_out',
        'qty_change' => -1,
        'reference_id' => $count->id,
    ]);

    $this->assertDatabaseHas('stock_balances', [
        'product_variant_id' => $this->variant->id,
        'qty_on_hand' => 0,
    ]);
});
