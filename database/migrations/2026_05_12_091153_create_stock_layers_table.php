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
        Schema::create('stock_layers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('purchase_item_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_variant_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('original_qty');
            $table->unsignedInteger('remaining_qty')->default(0);
            $table->decimal('unit_cost_usd', 12, 4)->default(0);
            $table->date('purchase_date');
            $table->timestamps();

            $table->index('product_variant_id');
            $table->index('purchase_date');
            $table->index(['product_variant_id', 'remaining_qty']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_layers');
    }
};
