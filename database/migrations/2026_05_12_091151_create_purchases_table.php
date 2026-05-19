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
        Schema::create('purchases', function (Blueprint $table) {
            $table->id();
            $table->foreignId('supplier_id')->nullable()->constrained()->nullOnDelete();
            $table->string('purchase_no')->unique();
            $table->date('purchase_date');
            $table->string('currency', 3)->default('USD');
            $table->decimal('exchange_rate', 12, 4)->default(1);
            $table->decimal('subtotal_usd', 14, 4)->default(0);
            $table->decimal('purchase_delivery_cost_usd', 14, 4)->default(0);
            $table->decimal('other_cost_usd', 14, 4)->default(0);
            $table->decimal('total_cost_usd', 14, 4)->default(0);
            $table->string('allocation_method', 20)->default('by_qty');
            $table->string('status', 20)->default('draft');
            $table->text('note')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('purchase_date');
            $table->index('status');
            $table->index('supplier_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('purchases');
    }
};
