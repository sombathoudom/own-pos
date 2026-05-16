<?php

use App\Models\DeliveryCompany;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->foreignId('delivery_company_id')
                ->nullable()
                ->after('source_page')
                ->constrained('delivery_companies')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropForeignIdFor(DeliveryCompany::class);
        });
    }
};
