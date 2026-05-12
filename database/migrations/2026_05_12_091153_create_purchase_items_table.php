<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('purchase_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('purchase_id')->constrained()->cascadeOnDelete();
            $table->foreignId('category_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_variant_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('qty');
            $table->decimal('unit_cost_usd', 12, 4)->default(0);
            $table->decimal('subtotal_usd', 14, 4)->default(0);
            $table->decimal('allocated_delivery_cost_usd', 14, 4)->default(0);
            $table->decimal('allocated_other_cost_usd', 14, 4)->default(0);
            $table->decimal('landed_unit_cost_usd', 12, 4)->default(0);
            $table->decimal('total_landed_cost_usd', 14, 4)->default(0);
            $table->decimal('sale_price_usd', 12, 4)->default(0);
            $table->decimal('expected_profit_per_unit_usd', 12, 4)->default(0);
            $table->timestamps();

            $table->index('purchase_id');
            $table->index('product_variant_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('purchase_items');
    }
};
