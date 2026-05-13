<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\ProductVariant;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LowStockAlertController extends Controller
{
    public function index(Request $request): Response
    {
        $threshold = (int) $request->input('threshold', 10);

        $variants = ProductVariant::query()
            ->with(['product:id,name', 'stockBalance'])
            ->where('status', 'active')
            ->whereHas('stockBalance', function ($q) use ($threshold) {
                $q->where('qty_on_hand', '<=', $threshold);
            })
            ->orderBy('sku')
            ->paginate(50)
            ->withQueryString();

        return Inertia::render('inventory/low-stock/index', [
            'variants' => $variants,
            'threshold' => $threshold,
        ]);
    }
}
