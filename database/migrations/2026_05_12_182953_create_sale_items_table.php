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
        Schema::create('sale_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sale_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_variant_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('qty');
            $table->decimal('unit_price_usd', 12, 4)->default(0);
            $table->decimal('discount_usd', 14, 4)->default(0);
            $table->decimal('total_usd', 14, 4)->default(0);
            $table->decimal('cogs_usd', 14, 4)->default(0);
            $table->decimal('profit_usd', 14, 4)->default(0);
            $table->timestamps();

            $table->index('sale_id');
            $table->index('product_variant_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sale_items');
    }
};
