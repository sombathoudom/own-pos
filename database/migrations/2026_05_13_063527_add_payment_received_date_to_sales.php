<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->date('payment_received_date')->nullable()->after('paid_usd');
            $table->date('delivery_completed_date')->nullable()->after('payment_received_date');
        });
    }

    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropColumn(['payment_received_date', 'delivery_completed_date']);
        });
    }
};
