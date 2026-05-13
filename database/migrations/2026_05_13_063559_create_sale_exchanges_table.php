<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sale_exchanges', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sale_id')->constrained()->cascadeOnDelete();
            $table->decimal('exchange_delivery_fee_usd', 16, 4)->default(0);
            $table->decimal('exchange_delivery_cost_usd', 16, 4)->default(0);
            $table->text('note')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('sale_exchange_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sale_exchange_id')->constrained('sale_exchanges')->cascadeOnDelete();
            $table->foreignId('sale_item_id')->constrained('sale_items')->cascadeOnDelete();
            $table->integer('qty_returned');
            $table->foreignId('new_variant_id')->nullable()->constrained('product_variants')->nullOnDelete();
            $table->decimal('new_unit_price_usd', 16, 4)->nullable();
            $table->foreignId('new_sale_item_id')->nullable()->constrained('sale_items')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sale_exchange_items');
        Schema::dropIfExists('sale_exchanges');
    }
};
