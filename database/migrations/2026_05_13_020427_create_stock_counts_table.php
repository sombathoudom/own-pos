<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_counts', function (Blueprint $table) {
            $table->id();
            $table->date('count_date');
            $table->string('status', 20)->default('draft');
            $table->foreignId('counted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('note')->nullable();
            $table->timestamps();

            $table->index('count_date');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_counts');
    }
};
