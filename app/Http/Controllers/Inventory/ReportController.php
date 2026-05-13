<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\DailyClosing;
use App\Models\DeliveryConfirmation;
use App\Models\Expense;
use App\Models\OrderDelivery;
use App\Models\Sale;
use App\Models\SaleExchange;
use App\Models\StockLayer;
use App\Models\StockMovement;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    public function daily(Request $request): Response
    {
        $date = $request->date('date') ?? now();

        $sales = Sale::query()
            ->where('payment_status', 'paid')
            ->whereNotNull('payment_received_date')
            ->whereDate('payment_received_date', $date)
            ->with(['items.productVariant.product', 'exchanges', 'returns'])
            ->get();

        $exchangeReceipts = SaleExchange::query()
            ->whereDate('payment_received_date', $date)
            ->with('sale')
            ->get();

        $returnReceipts = SaleReturn::query()
            ->whereDate('payment_received_date', $date)
            ->with('sale')
            ->get();

        $entries = $this->buildDailyEntries($sales, $exchangeReceipts, $returnReceipts);

        $closings = DailyClosing::query()
            ->whereDate('closing_date', $date)
            ->get();

        return Inertia::render('inventory/reports/daily', [
            'date' => $date->toDateString(),
            'entries' => $entries,
            'closings' => $closings,
        ]);
    }

    public function monthly(Request $request): Response
    {
        $month = $request->input('month', now()->format('Y-m'));
        $start = now()->parse($month.'-01')->startOfMonth();
        $end = $start->copy()->endOfMonth();

        $sales = Sale::query()
            ->where('payment_status', 'paid')
            ->whereNotNull('payment_received_date')
            ->whereBetween('payment_received_date', [$start->toDateString(), $end->toDateString()])
            ->with(['items', 'exchanges', 'returns'])
            ->get();

        $exchangeReceipts = SaleExchange::query()
            ->whereBetween('payment_received_date', [$start->toDateString(), $end->toDateString()])
            ->get();

        $returnReceipts = SaleReturn::query()
            ->whereBetween('payment_received_date', [$start->toDateString(), $end->toDateString()])
            ->get();

        $deliveryConfirmations = DeliveryConfirmation::query()
            ->whereBetween('confirmation_date', [$start->toDateString(), $end->toDateString()])
            ->with('items.finalVariant')
            ->get();

        $expenses = Expense::query()
            ->whereBetween('expense_date', [$start, $end])
            ->get();

        $totalRevenue = (string) bcadd(
            bcsub(
                (string) $sales->sum(fn (Sale $sale) => $this->baseSaleRevenue($sale)),
                (string) $returnReceipts->sum('total_refund_usd'),
                4,
            ),
            (string) $exchangeReceipts->sum('total_additional_amount_usd'),
            4,
        );
        $totalCogs = (string) bcadd(
            bcsub(
                (string) $sales->sum(fn (Sale $sale) => $this->baseSaleCogs($sale)),
                (string) $returnReceipts->sum(function (SaleReturn $return) {
                    return $return->items->sum('cogs_usd');
                }),
                4,
            ),
            (string) $exchangeReceipts->sum('additional_cogs_usd'),
            4,
        );
        $grossProfit = bcsub($totalRevenue, $totalCogs, 4);
        $totalExpenses = (string) $expenses->sum('amount_usd');
        $netProfit = bcsub($grossProfit, $totalExpenses, 4);
        $totalQtySold = $deliveryConfirmations->sum(
            fn ($confirmation) => $confirmation->items->sum(fn ($item) => $item->accepted_qty + $item->added_qty),
        ) + $exchangeReceipts->sum('additional_qty_sold')
          - $returnReceipts->sum(function (SaleReturn $return) {
              return $return->items->sum('qty');
          });

        $topSelling = $deliveryConfirmations->flatMap(function ($confirmation) {
            return $confirmation->items->map(function ($item) {
                $variantId = $item->final_product_variant_id ?? $item->original_product_variant_id;

                return [
                    'variant_id' => $variantId,
                    'qty' => $item->accepted_qty + $item->added_qty,
                    'revenue' => $item->final_total_usd,
                ];
            });
        })
            ->filter(fn ($item) => $item['variant_id'] !== null && $item['qty'] > 0)
            ->groupBy('variant_id')
            ->map(fn ($items) => [
                'variant_id' => $items->first()['variant_id'],
                'qty' => $items->sum('qty'),
                'revenue' => (string) $items->sum('revenue'),
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
            ->where('payment_status', 'paid')
            ->whereNotNull('payment_received_date')
            ->whereBetween('payment_received_date', [$from->toDateString(), $to->toDateString()])
            ->where('order_status', '!=', 'cancelled')
            ->with(['items.productVariant.product', 'exchanges', 'returns'])
            ->get();

        $productProfits = $sales->flatMap(fn ($s) => $s->items)
            ->groupBy('product_variant_id')
            ->map(fn ($items) => [
                'variant_id' => $items->first()->product_variant_id,
                'sku' => $items->first()->productVariant?->sku,
                'product_name' => $items->first()->productVariant?->product?->name,
                'qty_sold' => $items->sum('final_qty'),
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
            ->where('payment_status', 'paid')
            ->whereNotNull('payment_received_date')
            ->whereBetween('payment_received_date', [$from->toDateString(), $to->toDateString()])
            ->where('order_status', '!=', 'cancelled')
            ->with(['items.productVariant.product.category', 'exchanges', 'returns'])
            ->get();

        $categoryProfits = $sales->flatMap(fn ($s) => $s->items)
            ->groupBy(fn ($item) => $item->productVariant?->product?->category_id ?? 0)
            ->map(fn ($items) => [
                'category_id' => $items->first()->productVariant?->product?->category_id,
                'category_name' => $items->first()->productVariant?->product?->category?->name ?? 'Uncategorized',
                'qty_sold' => $items->sum('final_qty'),
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
            ->where('payment_status', 'paid')
            ->whereNotNull('payment_received_date')
            ->whereDate('payment_received_date', $date)
            ->with(['items.productVariant.product', 'exchanges', 'returns'])
            ->get();

        $exchangeReceipts = SaleExchange::query()
            ->whereDate('payment_received_date', $date)
            ->with('sale')
            ->get();

        $returnReceipts = SaleReturn::query()
            ->whereDate('payment_received_date', $date)
            ->with('sale')
            ->get();

        $entries = $this->buildDailyEntries($sales, $exchangeReceipts, $returnReceipts);

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="daily-report-'.$date->toDateString().'.csv"',
        ];

        return response()->stream(function () use ($entries) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['Reference', 'Customer', 'Type', 'Status', 'Total', 'Profit']);

            foreach ($entries as $entry) {
                fputcsv($handle, [
                    $entry['invoice_no'],
                    $entry['customer_name'],
                    $entry['entry_type'],
                    $entry['order_status'],
                    $entry['total_usd'],
                    $entry['profit_usd'],
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
            ->where('payment_status', 'paid')
            ->whereNotNull('payment_received_date')
            ->whereBetween('payment_received_date', [$start->toDateString(), $end->toDateString()])
            ->with(['items.productVariant.product', 'exchanges', 'returns'])
            ->get();

        $exchangeReceipts = SaleExchange::query()
            ->whereBetween('payment_received_date', [$start->toDateString(), $end->toDateString()])
            ->with('sale')
            ->get();

        $returnReceipts = SaleReturn::query()
            ->whereBetween('payment_received_date', [$start->toDateString(), $end->toDateString()])
            ->with('sale')
            ->get();

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="monthly-report-'.$month.'.csv"',
        ];

        return response()->stream(function () use ($sales, $exchangeReceipts, $returnReceipts) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['Date', 'Reference', 'Type', 'Revenue', 'Profit']);

            foreach ($sales as $sale) {
                fputcsv($handle, [
                    $sale->payment_received_date?->toDateString() ?? $sale->sale_date?->toDateString(),
                    $sale->invoice_no,
                    'sale',
                    $this->baseSaleRevenue($sale),
                    $this->baseSaleProfit($sale),
                ]);
            }

            foreach ($exchangeReceipts as $exchange) {
                fputcsv($handle, [
                    $exchange->payment_received_date?->toDateString(),
                    ($exchange->sale?->invoice_no ?? 'Sale').' / EX-'.$exchange->id,
                    'exchange',
                    $exchange->total_additional_amount_usd,
                    $exchange->additional_profit_usd,
                ]);
            }

            foreach ($returnReceipts as $return) {
                fputcsv($handle, [
                    $return->payment_received_date?->toDateString(),
                    ($return->sale?->invoice_no ?? 'Sale').' / RET-'.$return->id,
                    'return',
                    $return->total_refund_usd * -1,
                    $return->items->sum('cogs_usd') * -1,
                ]);
            }

            fclose($handle);
        }, 200, $headers);
    }

    private function buildDailyEntries(Collection $sales, Collection $exchangeReceipts, Collection $returnReceipts): Collection
    {
        $saleEntries = $sales->map(fn (Sale $sale) => [
            'id' => 'sale-'.$sale->id,
            'invoice_no' => $sale->invoice_no,
            'customer_name' => $sale->customer_name ?? 'Walk-in',
            'entry_type' => 'sale',
            'order_status' => $sale->order_status,
            'total_usd' => $this->baseSaleRevenue($sale),
            'profit_usd' => $this->baseSaleProfit($sale),
            'receipt_date' => $sale->payment_received_date?->toDateString() ?? $sale->sale_date?->toDateString(),
        ]);

        $exchangeEntries = $exchangeReceipts->map(fn (SaleExchange $exchange) => [
            'id' => 'exchange-'.$exchange->id,
            'invoice_no' => ($exchange->sale?->invoice_no ?? 'Sale').' / EX-'.$exchange->id,
            'customer_name' => $exchange->sale?->customer_name ?? 'Walk-in',
            'entry_type' => 'exchange',
            'order_status' => 'completed',
            'total_usd' => (string) $exchange->total_additional_amount_usd,
            'profit_usd' => (string) $exchange->additional_profit_usd,
            'receipt_date' => $exchange->payment_received_date?->toDateString(),
        ]);

        $returnEntries = $returnReceipts->map(fn (SaleReturn $return) => [
            'id' => 'return-'.$return->id,
            'invoice_no' => ($return->sale?->invoice_no ?? 'Sale').' / RET-'.$return->id,
            'customer_name' => $return->sale?->customer_name ?? 'Walk-in',
            'entry_type' => 'return',
            'order_status' => $return->sale?->order_status ?? 'returned',
            'total_usd' => (string) ($return->total_refund_usd * -1),
            'profit_usd' => (string) ($return->items->sum('cogs_usd') * -1),
            'receipt_date' => $return->payment_received_date?->toDateString(),
        ]);

        return $saleEntries
            ->concat($exchangeEntries)
            ->concat($returnEntries)
            ->sortBy('receipt_date')
            ->values();
    }

    private function baseSaleRevenue(Sale $sale): string
    {
        $exchangeAdditions = (string) $sale->exchanges->sum('total_additional_amount_usd');
        $returnDeductions = (string) $sale->returns->sum('total_refund_usd');

        return bcsub(bcadd((string) $sale->total_usd, $returnDeductions, 4), $exchangeAdditions, 4);
    }

    private function baseSaleProfit(Sale $sale): string
    {
        $exchangeProfit = (string) $sale->exchanges->sum('additional_profit_usd');
        $returnCogsDeducted = (string) $sale->returns->flatMap(fn ($r) => $r->items)->sum('cogs_usd');

        $itemsProfit = (string) $sale->items->sum('profit_usd');
        $itemsCogs = (string) $sale->items->sum('cogs_usd');

        $netProfit = bcsub($itemsProfit, $exchangeProfit, 4);

        return (string) $netProfit;
    }

    private function baseSaleCogs(Sale $sale): string
    {
        $exchangeCogs = (string) $sale->exchanges->sum('additional_cogs_usd');

        $itemsCogs = (string) $sale->items->sum('cogs_usd');

        return bcsub($itemsCogs, $exchangeCogs, 4);
    }
}
