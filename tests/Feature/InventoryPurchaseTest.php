<?php

use App\Actions\Inventory\AllocatePurchaseCosts;
use App\Actions\Inventory\ReceivePurchase;
use App\Actions\Inventory\RecordStockMovement;
use App\Actions\Inventory\SyncStockBalance;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\StockBalance;
use App\Models\StockLayer;
use App\Models\StockMovement;
use App\Models\Supplier;
use App\Models\User;

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

    $this->variantM = ProductVariant::create([
        'product_id' => $this->product->id,
        'sku' => 'HAWAI-BLUE-M',
        'color' => 'Blue',
        'size' => 'M',
        'sale_price_usd' => 6.00,
    ]);

    $this->variantL = ProductVariant::create([
        'product_id' => $this->product->id,
        'sku' => 'HAWAI-BLUE-L',
        'color' => 'Blue',
        'size' => 'L',
        'sale_price_usd' => 6.00,
    ]);
});

test('purchase creates stock layers movements and balances', function () {
    $purchase = Purchase::create([
        'purchase_no' => 'PO-001',
        'purchase_date' => '2026-05-12',
        'supplier_id' => Supplier::create(['name' => 'ABC Supplier'])->id,
        'currency' => 'USD',
        'exchange_rate' => 1,
        'subtotal_usd' => 0,
        'purchase_delivery_cost_usd' => 30.00,
        'other_cost_usd' => 5.00,
        'total_cost_usd' => 0,
        'allocation_method' => 'by_qty',
        'status' => 'draft',
        'created_by' => $this->user->id,
    ]);

    $itemM = PurchaseItem::create([
        'purchase_id' => $purchase->id,
        'category_id' => $this->category->id,
        'product_id' => $this->product->id,
        'product_variant_id' => $this->variantM->id,
        'qty' => 20,
        'unit_cost_usd' => 2.03,
        'sale_price_usd' => 6.00,
    ]);

    $itemL = PurchaseItem::create([
        'purchase_id' => $purchase->id,
        'category_id' => $this->category->id,
        'product_id' => $this->product->id,
        'product_variant_id' => $this->variantL->id,
        'qty' => 30,
        'unit_cost_usd' => 2.03,
        'sale_price_usd' => 6.00,
    ]);

    $receivePurchase = new ReceivePurchase(
        new AllocatePurchaseCosts,
        new RecordStockMovement,
        new SyncStockBalance,
    );

    $receivePurchase->handle($purchase->fresh());

    $purchase = $purchase->fresh();
    expect($purchase->status)->toBe('confirmed');

    expect(StockLayer::count())->toBe(2);
    expect(StockMovement::count())->toBe(2);
    expect(StockBalance::count())->toBe(2);

    $layerM = StockLayer::where('product_variant_id', $this->variantM->id)->first();
    expect($layerM->original_qty)->toBe(20);
    expect($layerM->remaining_qty)->toBe(20);

    $balanceM = StockBalance::where('product_variant_id', $this->variantM->id)->first();
    expect($balanceM->qty_on_hand)->toBe(20);

    $balanceL = StockBalance::where('product_variant_id', $this->variantL->id)->first();
    expect($balanceL->qty_on_hand)->toBe(30);

    $movementM = StockMovement::where('product_variant_id', $this->variantM->id)->first();
    expect($movementM->type)->toBe('purchase');
    expect($movementM->qty_change)->toBe(20);
});

test('landed cost is allocated by quantity', function () {
    $purchase = Purchase::create([
        'purchase_no' => 'PO-002',
        'purchase_date' => '2026-05-12',
        'currency' => 'USD',
        'exchange_rate' => 1,
        'purchase_delivery_cost_usd' => 30.00,
        'other_cost_usd' => 5.00,
        'allocation_method' => 'by_qty',
        'status' => 'draft',
        'created_by' => $this->user->id,
    ]);

    $item = PurchaseItem::create([
        'purchase_id' => $purchase->id,
        'category_id' => $this->category->id,
        'product_id' => $this->product->id,
        'product_variant_id' => $this->variantM->id,
        'qty' => 95,
        'unit_cost_usd' => 2.03,
        'subtotal_usd' => 0,
        'allocated_delivery_cost_usd' => 0,
        'allocated_other_cost_usd' => 0,
        'landed_unit_cost_usd' => 0,
        'total_landed_cost_usd' => 0,
        'sale_price_usd' => 6.00,
        'expected_profit_per_unit_usd' => 0,
    ]);

    $allocate = new AllocatePurchaseCosts;
    $allocate->allocateByQty([$item->fresh()], '35.0000');

    $item = $item->fresh();

    expect((float) $item->landed_unit_cost_usd)->toBe((float) '2.3984');
    expect((float) $item->total_landed_cost_usd)->toBe((float) '227.8480');
    expect((float) $item->expected_profit_per_unit_usd)->toBe((float) '3.6016');
});

test('stock balance cannot go negative', function () {
    $balance = StockBalance::create([
        'product_variant_id' => $this->variantM->id,
        'qty_on_hand' => 5,
    ]);

    $sync = new SyncStockBalance;

    $result = $sync->decrementOnHand($this->variantM->id, 10);

    expect($result->qty_on_hand)->toBe(0);
});

test('stock movement is source of truth', function () {
    StockBalance::create([
        'product_variant_id' => $this->variantM->id,
        'qty_on_hand' => 50,
    ]);

    $sync = new SyncStockBalance;
    $result = $sync->recalculate($this->variantM->id);

    expect($result->qty_on_hand)->toBe(0);
});

test('purchase movements keep the purchase reference note', function () {
    $purchase = Purchase::create([
        'purchase_no' => 'PO-REF',
        'purchase_date' => '2026-05-12',
        'currency' => 'USD',
        'exchange_rate' => 1,
        'purchase_delivery_cost_usd' => 12.50,
        'other_cost_usd' => 2.50,
        'allocation_method' => 'by_qty',
        'status' => 'draft',
        'created_by' => $this->user->id,
    ]);

    PurchaseItem::create([
        'purchase_id' => $purchase->id,
        'category_id' => $this->category->id,
        'product_id' => $this->product->id,
        'product_variant_id' => $this->variantM->id,
        'qty' => 10,
        'unit_cost_usd' => 2.00,
        'sale_price_usd' => 6.00,
    ]);

    $receivePurchase = new ReceivePurchase(
        new AllocatePurchaseCosts,
        new RecordStockMovement,
        new SyncStockBalance,
    );

    $receivePurchase->handle($purchase);

    $movement = StockMovement::query()->first();
    $layer = StockLayer::query()->first();

    expect($movement)->not->toBeNull();
    expect($layer)->not->toBeNull();
    expect($movement->note)->toBe('Purchase #PO-REF');
    expect((float) $movement->unit_cost_usd)->toBe((float) $layer->unit_cost_usd);
});
