<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Sale;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PackagingLogController extends Controller
{
    public function show(Sale $sale): Response
    {
        $sale->load('packagingLogs');

        return Inertia::render('inventory/sales/packaging', [
            'sale' => [
                'id' => $sale->id,
                'invoice_no' => $sale->invoice_no,
                'packaging_logs' => $sale->packagingLogs->map(fn ($log) => [
                    'id' => $log->id,
                    'status' => $log->status,
                    'packed_by' => $log->packedBy?->name,
                    'packed_at' => $log->packed_at?->toDateTimeString(),
                    'checked_by' => $log->checkedBy?->name,
                    'checked_at' => $log->checked_at?->toDateTimeString(),
                    'note' => $log->note,
                ]),
            ],
        ]);
    }

    public function storeOrUpdate(Request $request, Sale $sale): RedirectResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'string', 'in:waiting,packing,packed,checked,handover_to_delivery'],
            'packed_by' => ['nullable', 'integer', 'exists:users,id'],
            'checked_by' => ['nullable', 'integer', 'exists:users,id'],
            'note' => ['nullable', 'string'],
        ]);

        $sale->packagingLogs()->create([
            ...$validated,
            'packed_at' => $validated['packed_by'] ? now() : null,
            'checked_at' => $validated['checked_by'] ? now() : null,
        ]);

        return to_route('sales.show', $sale)->with('toast', ['type' => 'success', 'message' => 'Packaging updated.']);
    }
}
