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
        Schema::table('sales', function (Blueprint $table) {
            $table->decimal('original_subtotal_usd', 14, 4)->default(0)->after('exchange_rate');
            $table->decimal('original_delivery_fee_usd', 14, 4)->default(0)->after('discount_usd');
            $table->decimal('original_total_usd', 14, 4)->default(0)->after('total_usd');
        });

        DB::statement('UPDATE sales SET original_subtotal_usd = subtotal_usd, original_delivery_fee_usd = customer_delivery_fee_usd, original_total_usd = total_usd');

        Schema::table('sale_items', function (Blueprint $table) {
            $table->string('status', 30)->default('pending')->after('product_variant_id');
            $table->unsignedInteger('accepted_qty')->default(0)->after('qty');
            $table->unsignedInteger('rejected_qty')->default(0)->after('accepted_qty');
            $table->unsignedInteger('final_qty')->default(0)->after('rejected_qty');
        });

        DB::statement("UPDATE sale_items SET status = 'accepted', accepted_qty = qty, final_qty = qty");

        Schema::create('delivery_confirmations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sale_id')->constrained()->cascadeOnDelete();
            $table->date('confirmation_date');
            $table->decimal('original_product_total_usd', 14, 4)->default(0);
            $table->decimal('final_product_total_usd', 14, 4)->default(0);
            $table->decimal('original_delivery_fee_usd', 14, 4)->default(0);
            $table->decimal('final_delivery_fee_usd', 14, 4)->default(0);
            $table->decimal('discount_usd', 14, 4)->default(0);
            $table->decimal('final_total_usd', 14, 4)->default(0);
            $table->string('delivery_fee_note')->nullable();
            $table->string('status', 30);
            $table->text('note')->nullable();
            $table->foreignId('confirmed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['sale_id', 'confirmation_date']);
            $table->index('status');
        });

        Schema::create('delivery_confirmation_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('delivery_confirmation_id')->constrained()->cascadeOnDelete();
            $table->foreignId('sale_item_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('original_product_variant_id')->nullable()->constrained('product_variants')->nullOnDelete();
            $table->foreignId('final_product_variant_id')->nullable()->constrained('product_variants')->nullOnDelete();
            $table->unsignedInteger('original_qty')->default(0);
            $table->unsignedInteger('accepted_qty')->default(0);
            $table->unsignedInteger('rejected_qty')->default(0);
            $table->unsignedInteger('added_qty')->default(0);
            $table->decimal('unit_price_usd', 12, 4)->default(0);
            $table->decimal('final_total_usd', 14, 4)->default(0);
            $table->string('action_type', 30);
            $table->boolean('return_to_stock')->default(true);
            $table->string('condition', 30)->default('good');
            $table->text('note')->nullable();
            $table->timestamps();

            $table->index('action_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropColumn([
                'original_subtotal_usd',
                'original_delivery_fee_usd',
                'original_total_usd',
            ]);
        });

        Schema::dropIfExists('delivery_confirmation_items');
        Schema::dropIfExists('delivery_confirmations');

        Schema::table('sale_items', function (Blueprint $table) {
            $table->dropColumn([
                'status',
                'accepted_qty',
                'rejected_qty',
                'final_qty',
            ]);
        });
    }
};
