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
        Schema::create('sales', function (Blueprint $table) {
            $table->id();
            $table->string('invoice_no')->unique();
            $table->string('customer_name')->nullable();
            $table->string('customer_phone')->nullable();
            $table->date('sale_date');
            $table->string('currency', 3)->default('USD');
            $table->decimal('exchange_rate', 12, 4)->default(1);
            $table->decimal('subtotal_usd', 14, 4)->default(0);
            $table->decimal('discount_usd', 14, 4)->default(0);
            $table->decimal('customer_delivery_fee_usd', 14, 4)->default(0);
            $table->decimal('actual_delivery_cost_usd', 14, 4)->default(0);
            $table->decimal('delivery_profit_usd', 14, 4)->default(0);
            $table->decimal('total_usd', 14, 4)->default(0);
            $table->decimal('paid_usd', 14, 4)->default(0);
            $table->string('payment_status', 20)->default('unpaid');
            $table->string('order_status', 30)->default('draft');
            $table->text('note')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('sale_date');
            $table->index('payment_status');
            $table->index('order_status');
            $table->index('created_by');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sales');
    }
};
