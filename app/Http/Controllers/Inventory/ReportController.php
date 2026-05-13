<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\DailyClosing;
use App\Models\Expense;
use App\Models\OrderDelivery;
use App\Models\Sale;
use App\Models\StockLayer;
use App\Models\StockMovement;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReportController extends Controller
{
    public function daily(Request $request): Response
    {
        $date = $request->date('date') ?? now();

        $sales = Sale::query()
            ->whereDate('sale_date', $date)
            ->with('items.productVariant.product')
            ->get();

        $closings = DailyClosing::query()
            ->whereDate('closing_date', $date)
            ->get();

        return Inertia::render('inventory/reports/daily', [
            'date' => $date->toDateString(),
            'sales' => $sales,
            'closings' => $closings,
        ]);
    }

    public function monthly(Request $request): Response
    {
        $month = $request->input('month', now()->format('Y-m'));
        $start = now()->parse($month.'-01')->startOfMonth();
        $end = $start->copy()->endOfMonth();

        $sales = Sale::query()
            ->whereBetween('sale_date', [$start, $end])
            ->with('items')
            ->get();

        $expenses = Expense::query()
            ->whereBetween('expense_date', [$start, $end])
            ->get();

        $totalRevenue = (string) $sales->sum('subtotal_usd');
        $totalCogs = (string) $sales->sum(fn ($s) => $s->items->sum('cogs_usd'));
        $grossProfit = bcsub($totalRevenue, $totalCogs, 4);
        $totalExpenses = (string) $expenses->sum('amount_usd');
        $netProfit = bcsub($grossProfit, $totalExpenses, 4);
        $totalQtySold = $sales->sum(fn ($s) => $s->items->sum('qty'));

        $topSelling = $sales->flatMap(fn ($s) => $s->items)
            ->groupBy('product_variant_id')
            ->map(fn ($items) => [
                'variant_id' => $items->first()->product_variant_id,
                'qty' => $items->sum('qty'),
                'revenue' => (string) $items->sum('total_usd'),
            ])
            ->sortByDesc('qty')
            ->values()
            ->take(5);

        $returnRate = $sales->count() > 0
            ? bcdiv((string) $sales->whereIn('order_status', ['returned', 'partially_returned'])->count(), (string) $sales->count(), 4)
            : '0';

        $cancelRate = $sales->count() > 0
            ? bcdiv((string) $sales->where('order_status', 'cancelled')->count(), (string) $sales->count(), 4)
            : '0';

        return Inertia::render('inventory/reports/monthly', [
            'month' => $month,
            'summary' => [
                'total_revenue' => $totalRevenue,
                'total_cogs' => $totalCogs,
                'gross_profit' => $grossProfit,
                'total_expenses' => $totalExpenses,
                'net_profit' => $netProfit,
                'total_qty_sold' => $totalQtySold,
                'return_rate' => $returnRate,
                'cancel_rate' => $cancelRate,
            ],
            'top_selling' => $topSelling,
        ]);
    }

    public function profit(Request $request): Response
    {
        $from = $request->date('from') ?? now()->startOfMonth();
        $to = $request->date('to') ?? now();

        $sales = Sale::query()
            ->whereBetween('sale_date', [$from, $to])
            ->where('order_status', '!=', 'cancelled')
            ->with('items.productVariant.product')
            ->get();

        $productProfits = $sales->flatMap(fn ($s) => $s->items)
            ->groupBy('product_variant_id')
            ->map(fn ($items) => [
                'variant_id' => $items->first()->product_variant_id,
                'sku' => $items->first()->productVariant?->sku,
                'product_name' => $items->first()->productVariant?->product?->name,
                'qty_sold' => $items->sum('qty'),
                'revenue' => (string) $items->sum('total_usd'),
                'cogs' => (string) $items->sum('cogs_usd'),
                'profit' => (string) $items->sum('profit_usd'),
            ])
            ->sortByDesc('profit')
            ->values();

        return Inertia::render('inventory/reports/profit', [
            'from' => $from->toDateString(),
            'to' => $to->toDateString(),
            'productProfits' => $productProfits,
        ]);
    }

    public function stockValue(Request $request): Response
    {
        $layers = StockLayer::query()
            ->where('remaining_qty', '>', 0)
            ->with('productVariant.product')
            ->orderBy('product_variant_id')
            ->orderBy('purchase_date')
            ->get();

        $variantValues = $layers->groupBy('product_variant_id')
            ->map(function ($variantLayers) {
                $totalQty = $variantLayers->sum('remaining_qty');
                $totalValue = (string) $variantLayers->sum(fn ($l) => bcmul((string) $l->unit_cost_usd, (string) $l->remaining_qty, 4));

                return [
                    'variant_id' => $variantLayers->first()->product_variant_id,
                    'sku' => $variantLayers->first()->productVariant?->sku,
                    'product_name' => $variantLayers->first()->productVariant?->product?->name,
                    'total_qty' => $totalQty,
                    'total_value' => $totalValue,
                    'layers' => $variantLayers->map(fn ($l) => [
                        'remaining_qty' => $l->remaining_qty,
                        'unit_cost_usd' => $l->unit_cost_usd,
                        'layer_value' => bcmul((string) $l->unit_cost_usd, (string) $l->remaining_qty, 4),
                        'purchase_date' => $l->purchase_date?->toDateString(),
                    ]),
                ];
            })
            ->values();

        $grandTotal = (string) $variantValues->sum('total_value');

        return Inertia::render('inventory/reports/stock-value', [
            'variantValues' => $variantValues,
            'grandTotal' => $grandTotal,
        ]);
    }

    public function stockLoss(Request $request): Response
    {
        $from = $request->date('from') ?? now()->startOfMonth();
        $to = $request->date('to') ?? now();

        $movements = StockMovement::query()
            ->whereIn('type', ['damaged', 'missing', 'adjustment_out'])
            ->whereBetween('created_at', [$from->startOfDay(), $to->endOfDay()])
            ->with('productVariant.product')
            ->orderByDesc('created_at')
            ->paginate(50)
            ->withQueryString();

        $totalLoss = (string) $movements->sum(fn ($m) => bcmul((string) abs($m->qty_change), (string) ($m->unit_cost_usd ?? '0'), 4));

        return Inertia::render('inventory/reports/stock-loss', [
            'from' => $from->toDateString(),
            'to' => $to->toDateString(),
            'movements' => $movements,
            'totalLoss' => $totalLoss,
        ]);
    }

    public function categoryProfit(Request $request): Response
    {
        $from = $request->date('from') ?? now()->startOfMonth();
        $to = $request->date('to') ?? now();

        $sales = Sale::query()
            ->whereBetween('sale_date', [$from, $to])
            ->where('order_status', '!=', 'cancelled')
            ->with('items.productVariant.product.category')
            ->get();

        $categoryProfits = $sales->flatMap(fn ($s) => $s->items)
            ->groupBy(fn ($item) => $item->productVariant?->product?->category_id ?? 0)
            ->map(fn ($items) => [
                'category_id' => $items->first()->productVariant?->product?->category_id,
                'category_name' => $items->first()->productVariant?->product?->category?->name ?? 'Uncategorized',
                'qty_sold' => $items->sum('qty'),
                'revenue' => (string) $items->sum('total_usd'),
                'cogs' => (string) $items->sum('cogs_usd'),
                'profit' => (string) $items->sum('profit_usd'),
            ])
            ->sortByDesc('profit')
            ->values();

        return Inertia::render('inventory/reports/category-profit', [
            'from' => $from->toDateString(),
            'to' => $to->toDateString(),
            'categoryProfits' => $categoryProfits,
        ]);
    }

    public function deliveryFailed(Request $request): Response
    {
        $from = $request->date('from') ?? now()->startOfMonth();
        $to = $request->date('to') ?? now();

        $deliveries = OrderDelivery::query()
            ->whereIn('delivery_status', ['failed', 'returned'])
            ->whereBetween('created_at', [$from->startOfDay(), $to->endOfDay()])
            ->with('sale.items.productVariant.product')
            ->orderByDesc('created_at')
            ->paginate(50)
            ->withQueryString();

        $totalFailed = $deliveries->count();

        return Inertia::render('inventory/reports/delivery-failed', [
            'from' => $from->toDateString(),
            'to' => $to->toDateString(),
            'deliveries' => $deliveries,
            'totalFailed' => $totalFailed,
        ]);
    }

    public function exportDailyCsv(Request $request): StreamedResponse
    {
        $date = $request->date('date') ?? now();

        $sales = Sale::query()
            ->whereDate('sale_date', $date)
            ->with('items.productVariant.product')
            ->get();

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="daily-report-'.$date->toDateString().'.csv"',
        ];

        return response()->stream(function () use ($sales) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['Invoice', 'Customer', 'Status', 'Payment', 'Total', 'COGS', 'Profit']);

            foreach ($sales as $sale) {
                fputcsv($handle, [
                    $sale->invoice_no,
                    $sale->customer_name ?? 'Walk-in',
                    $sale->order_status,
                    $sale->payment_status,
                    $sale->total_usd,
                    $sale->items->sum('cogs_usd'),
                    $sale->items->sum('profit_usd'),
                ]);
            }

            fclose($handle);
        }, 200, $headers);
    }

    public function exportMonthlyCsv(Request $request): StreamedResponse
    {
        $month = $request->input('month', now()->format('Y-m'));
        $start = now()->parse($month.'-01')->startOfMonth();
        $end = $start->copy()->endOfMonth();

        $sales = Sale::query()
            ->whereBetween('sale_date', [$start, $end])
            ->with('items.productVariant.product')
            ->get();

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="monthly-report-'.$month.'.csv"',
        ];

        return response()->stream(function () use ($sales) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['Date', 'Invoice', 'Product', 'Qty', 'Revenue', 'COGS', 'Profit']);

            foreach ($sales as $sale) {
                foreach ($sale->items as $item) {
                    fputcsv($handle, [
                        $sale->sale_date?->toDateString(),
                        $sale->invoice_no,
                        $item->productVariant?->product?->name ?? '-',
                        $item->qty,
                        $item->total_usd,
                        $item->cogs_usd,
                        $item->profit_usd,
                    ]);
                }
            }

            fclose($handle);
        }, 200, $headers);
    }
}
