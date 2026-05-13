<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('daily_closings', function (Blueprint $table) {
            $table->id();
            $table->date('closing_date')->unique();
            $table->integer('total_orders')->default(0);
            $table->integer('completed_orders')->default(0);
            $table->integer('cancelled_orders')->default(0);
            $table->integer('returned_orders')->default(0);
            $table->integer('total_qty_sold')->default(0);
            $table->decimal('gross_sales_usd', 16, 4)->default(0);
            $table->decimal('discount_usd', 16, 4)->default(0);
            $table->decimal('net_sales_usd', 16, 4)->default(0);
            $table->decimal('total_cogs_usd', 16, 4)->default(0);
            $table->decimal('gross_profit_usd', 16, 4)->default(0);
            $table->decimal('total_expenses_usd', 16, 4)->default(0);
            $table->decimal('net_profit_usd', 16, 4)->default(0);
            $table->decimal('cash_usd', 16, 4)->default(0);
            $table->decimal('cash_khr', 16, 4)->default(0);
            $table->decimal('bank_usd', 16, 4)->default(0);
            $table->decimal('unpaid_usd', 16, 4)->default(0);
            $table->decimal('refund_usd', 16, 4)->default(0);
            $table->foreignId('closed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('closed_at')->nullable();
            $table->string('status', 20)->default('open');
            $table->text('note')->nullable();
            $table->timestamps();

            $table->index('closing_date');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('daily_closings');
    }
};
