<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('sale_exchanges', function (Blueprint $table) {
            $table->date('exchange_date')->nullable()->after('sale_id');
            $table->date('payment_received_date')->nullable()->after('exchange_date');
            $table->decimal('subtotal_adjustment_usd', 16, 4)->default(0)->after('exchange_delivery_cost_usd');
            $table->decimal('new_items_subtotal_usd', 16, 4)->default(0)->after('subtotal_adjustment_usd');
            $table->decimal('total_additional_amount_usd', 16, 4)->default(0)->after('new_items_subtotal_usd');
            $table->decimal('additional_cogs_usd', 16, 4)->default(0)->after('total_additional_amount_usd');
            $table->decimal('additional_profit_usd', 16, 4)->default(0)->after('additional_cogs_usd');
            $table->unsignedInteger('additional_qty_sold')->default(0)->after('total_additional_amount_usd');
        });

        DB::statement('UPDATE sale_exchanges SET exchange_date = DATE(created_at)');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sale_exchanges', function (Blueprint $table) {
            $table->dropColumn([
                'exchange_date',
                'payment_received_date',
                'subtotal_adjustment_usd',
                'new_items_subtotal_usd',
                'total_additional_amount_usd',
                'additional_cogs_usd',
                'additional_profit_usd',
                'additional_qty_sold',
            ]);
        });
    }
};
