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
        Schema::create('sale_item_cost_layers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sale_item_id')->constrained()->cascadeOnDelete();
            $table->foreignId('stock_layer_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('qty');
            $table->decimal('unit_cost_usd', 12, 4)->default(0);
            $table->decimal('total_cost_usd', 14, 4)->default(0);
            $table->timestamps();

            $table->index('sale_item_id');
            $table->index('stock_layer_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sale_item_cost_layers');
    }
};
