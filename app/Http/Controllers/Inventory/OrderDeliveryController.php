<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Sale;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OrderDeliveryController extends Controller
{
    public function show(Sale $sale): Response
    {
        $sale->load('delivery');

        return Inertia::render('inventory/sales/delivery', [
            'sale' => [
                'id' => $sale->id,
                'invoice_no' => $sale->invoice_no,
                'delivery' => $sale->delivery ? [
                    'delivery_company' => $sale->delivery->delivery_company,
                    'tracking_no' => $sale->delivery->tracking_no,
                    'customer_delivery_fee_usd' => $sale->delivery->customer_delivery_fee_usd,
                    'actual_delivery_cost_usd' => $sale->delivery->actual_delivery_cost_usd,
                    'delivery_status' => $sale->delivery->delivery_status,
                    'delivered_at' => $sale->delivery->delivered_at?->toDateTimeString(),
                    'failed_reason' => $sale->delivery->failed_reason,
                    'note' => $sale->delivery->note,
                ] : null,
            ],
        ]);
    }

    public function storeOrUpdate(Request $request, Sale $sale): RedirectResponse
    {
        $validated = $request->validate([
            'delivery_company' => ['nullable', 'string', 'max:100'],
            'tracking_no' => ['nullable', 'string', 'max:100'],
            'customer_delivery_fee_usd' => ['required', 'numeric', 'min:0'],
            'actual_delivery_cost_usd' => ['required', 'numeric', 'min:0'],
            'delivery_status' => ['required', 'string', 'in:pending,packed,picked_up,delivering,delivered,failed,returned,cancelled'],
            'delivered_at' => ['nullable', 'date'],
            'failed_reason' => ['nullable', 'string'],
            'note' => ['nullable', 'string'],
        ]);

        $fee = (string) $validated['customer_delivery_fee_usd'];
        $cost = (string) $validated['actual_delivery_cost_usd'];
        $profit = bcsub($fee, $cost, 4);

        $sale->delivery()->updateOrCreate(
            ['sale_id' => $sale->id],
            [
                ...$validated,
                'delivery_profit_usd' => $profit,
            ]
        );

        return to_route('sales.show', $sale)->with('toast', ['type' => 'success', 'message' => 'Delivery updated.']);
    }
}
