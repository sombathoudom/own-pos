<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders_delivery', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sale_id')->constrained()->cascadeOnDelete();
            $table->string('delivery_company')->nullable();
            $table->string('tracking_no')->nullable();
            $table->decimal('customer_delivery_fee_usd', 14, 4)->default(0);
            $table->decimal('actual_delivery_cost_usd', 14, 4)->default(0);
            $table->decimal('delivery_profit_usd', 14, 4)->default(0);
            $table->string('delivery_status', 20)->default('pending');
            $table->timestamp('delivered_at')->nullable();
            $table->text('failed_reason')->nullable();
            $table->text('note')->nullable();
            $table->timestamps();

            $table->index('delivery_status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders_delivery');
    }
};
