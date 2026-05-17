<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->foreignId('customer_id')->nullable()->after('id')->constrained()->nullOnDelete();
            $table->decimal('total_khr', 12, 4)->default(0)->after('total_usd');
        });

        // $sales = DB::table('sales')
        //     ->select('id', 'customer_name', 'customer_phone', 'customer_address')
        //     ->where(function ($query) {
        //         $query->whereNotNull('customer_name')
        //             ->orWhereNotNull('customer_phone')
        //             ->orWhereNotNull('customer_address');
        //     })
        //     ->get();

        // foreach ($sales as $sale) {
        //     $customerName = trim((string) ($sale->customer_name ?? ''));
        //     $customerName = $customerName !== '' ? $customerName : 'Walk-in';

        //     $customer = DB::table('customers')
        //         ->where('name', $customerName)
        //         ->where('phone', $sale->customer_phone)
        //         ->where('address', $sale->customer_address)
        //         ->first();

        //     if (! $customer) {
        //         $customerId = DB::table('customers')->insertGetId([
        //             'name' => $customerName,
        //             'phone' => $sale->customer_phone,
        //             'address' => $sale->customer_address,
        //             'status' => 'active',
        //             'created_at' => now(),
        //             'updated_at' => now(),
        //         ]);
        //     } else {
        //         $customerId = $customer->id;
        //     }

        //     DB::table('sales')
        //         ->where('id', $sale->id)
        //         ->update(['customer_id' => $customerId]);
        // }

        Schema::table('sales', function (Blueprint $table) {
            $table->dropColumn(['customer_name', 'customer_phone', 'customer_address']);
        });
    }

    public function down(): void
    {
        // Schema::table('sales', function (Blueprint $table) {
        //     $table->string('customer_name')->nullable()->after('invoice_no');
        //     $table->string('customer_phone')->nullable()->after('customer_name');
        //     $table->string('customer_address')->nullable()->after('customer_phone');
        // });

        // $sales = DB::table('sales')
        //     ->join('customers', 'customers.id', '=', 'sales.customer_id')
        //     ->select('sales.id', 'customers.name', 'customers.phone', 'customers.address')
        //     ->get();

        // foreach ($sales as $sale) {
        //     DB::table('sales')
        //         ->where('id', $sale->id)
        //         ->update([
        //             'customer_name' => $sale->name,
        //             'customer_phone' => $sale->phone,
        //             'customer_address' => $sale->address,
        //         ]);
        // }

        Schema::table('sales', function (Blueprint $table) {
            $table->dropForeign(['customer_id']);
            $table->dropColumn(['customer_id', 'total_khr']);
        });
    }
};
