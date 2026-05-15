<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\DailyClosing;
use App\Models\DeliveryConfirmation;
use App\Models\Expense;
use App\Models\OrderDelivery;
use App\Models\Purchase;
use App\Models\Sale;
use App\Models\SaleExchange;
use App\Models\SaleReturn;
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
            ->with(['items.productVariant.product', 'exchanges', 'returns.items', 'delivery'])
            ->get();

        $exchangeReceipts = SaleExchange::query()
            ->whereDate('payment_received_date', $date)
            ->with('sale')
            ->get();

        $returnReceipts = SaleReturn::query()
            ->whereDate('payment_received_date', $date)
            ->with(['sale.delivery', 'items'])
            ->get();

        $entries = $this->buildDailyEntries($sales, $exchangeReceipts, $returnReceipts);
        $expenses = Expense::query()
            ->whereDate('expense_date', $date)
            ->get();

        $closings = DailyClosing::query()
            ->whereDate('closing_date', $date)
            ->get();

        return Inertia::render('inventory/reports/daily', [
            'date' => $date->toDateString(),
            'entries' => $entries,
            'closings' => $closings,
            'summary' => $this->buildDailySummary($entries, $expenses),
            'expense_breakdown' => $this->buildExpenseBreakdown($expenses),
            'courier_breakdown' => $this->buildCourierBreakdown($entries),
            'source_breakdown' => $this->buildSourceBreakdown($entries),
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
            ->with(['items.productVariant.product', 'exchanges', 'returns.items', 'delivery'])
            ->get();

        $exchangeReceipts = SaleExchange::query()
            ->whereBetween('payment_received_date', [$start->toDateString(), $end->toDateString()])
            ->with('sale.delivery')
            ->get();

        $returnReceipts = SaleReturn::query()
            ->whereBetween('payment_received_date', [$start->toDateString(), $end->toDateString()])
            ->with(['sale.delivery', 'items'])
            ->get();

        $deliveryConfirmations = DeliveryConfirmation::query()
            ->whereBetween('confirmation_date', [$start->toDateString(), $end->toDateString()])
            ->with('items.finalVariant')
            ->get();

        $expenses = Expense::query()
            ->whereBetween('expense_date', [$start, $end])
            ->get();

        $entries = $this->buildDailyEntries($sales, $exchangeReceipts, $returnReceipts);
        $purchases = Purchase::query()
            ->with('supplier')
            ->whereBetween('purchase_date', [$start->toDateString(), $end->toDateString()])
            ->orderBy('purchase_date')
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
        $grossProfit = $this->decimalize($entries->sum('profit_usd'));
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
            'daily_ledger' => $this->buildMonthlyDailyLedger($entries, $expenses),
            'expense_breakdown' => $this->buildExpenseBreakdown($expenses),
            'purchase_breakdown' => $this->buildPurchaseBreakdown($purchases),
            'source_breakdown' => $this->buildSourceBreakdown($entries),
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
            'summary' => [
                'total_revenue' => (string) $productProfits->sum('revenue'),
                'total_cogs' => (string) $productProfits->sum('cogs'),
                'total_profit' => (string) $productProfits->sum('profit'),
                'total_qty_sold' => $productProfits->sum('qty_sold'),
            ],
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
            'summary' => [
                'total_revenue' => (string) $categoryProfits->sum('revenue'),
                'total_cogs' => (string) $categoryProfits->sum('cogs'),
                'total_profit' => (string) $categoryProfits->sum('profit'),
                'total_qty_sold' => $categoryProfits->sum('qty_sold'),
            ],
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
            'source_page' => $sale->source_page,
            'qty_sold' => (int) $sale->items->sum('final_qty'),
            'price_mix' => $this->describePriceMix($sale->items),
            'product_total_usd' => $this->baseSaleProductRevenue($sale),
            'product_cogs_usd' => $this->baseSaleCogs($sale),
            'delivery_cost_usd' => (string) $sale->actual_delivery_cost_usd,
            'delivery_company' => $sale->delivery?->delivery_company,
            'note' => $sale->note,
            'price_pack_usd' => $this->baseSaleRevenue($sale),
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
            'source_page' => $exchange->sale?->source_page,
            'qty_sold' => (int) $exchange->additional_qty_sold,
            'price_mix' => $exchange->additional_qty_sold > 0 ? 'Exchange items' : 'Delivery fee only',
            'product_total_usd' => (string) $exchange->new_items_subtotal_usd,
            'product_cogs_usd' => (string) $exchange->additional_cogs_usd,
            'delivery_cost_usd' => (string) $exchange->exchange_delivery_cost_usd,
            'delivery_company' => $exchange->sale?->delivery?->delivery_company,
            'note' => $exchange->note,
            'price_pack_usd' => (string) $exchange->total_additional_amount_usd,
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
            'source_page' => $return->sale?->source_page,
            'qty_sold' => $return->items->sum('qty') * -1,
            'price_mix' => 'Returned items',
            'product_total_usd' => (string) ($return->total_refund_usd * -1),
            'product_cogs_usd' => (string) ($return->items->sum('cogs_usd') * -1),
            'delivery_cost_usd' => '0.0000',
            'delivery_company' => $return->sale?->delivery?->delivery_company,
            'note' => $return->note,
            'price_pack_usd' => (string) ($return->total_refund_usd * -1),
            'total_usd' => (string) ($return->total_refund_usd * -1),
            'profit_usd' => (string) ($return->items->sum('cogs_usd') - $return->total_refund_usd),
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

    private function baseSaleProductRevenue(Sale $sale): string
    {
        $deliveryRevenue = (string) $sale->customer_delivery_fee_usd;

        return bcsub($this->baseSaleRevenue($sale), $deliveryRevenue, 4);
    }

    private function baseSaleProfit(Sale $sale): string
    {
        return bcsub(
            bcsub($this->baseSaleRevenue($sale), $this->baseSaleCogs($sale), 4),
            (string) $sale->actual_delivery_cost_usd,
            4,
        );
    }

    private function baseSaleCogs(Sale $sale): string
    {
        $exchangeCogs = (string) $sale->exchanges->sum('additional_cogs_usd');
        $returnedCogs = (string) $sale->returns->flatMap(fn ($return) => $return->items)->sum('cogs_usd');

        $itemsCogs = (string) $sale->items->sum('cogs_usd');

        return bcsub(bcadd($itemsCogs, $returnedCogs, 4), $exchangeCogs, 4);
    }

    private function buildDailySummary(Collection $entries, Collection $expenses): array
    {
        $grossProfit = (string) $entries->sum('profit_usd');
        $expenseTotal = (string) $expenses->sum('amount_usd');

        return [
            'orders_count' => $entries->count(),
            'qty_sold' => $entries->sum('qty_sold'),
            'product_total_usd' => $this->decimalize($entries->sum('product_total_usd')),
            'product_cogs_usd' => $this->decimalize($entries->sum('product_cogs_usd')),
            'delivery_cost_usd' => $this->decimalize($entries->sum('delivery_cost_usd')),
            'price_pack_usd' => $this->decimalize($entries->sum('price_pack_usd')),
            'gross_profit_usd' => $this->decimalize($grossProfit),
            'boost_expense_usd' => $this->decimalize($expenseTotal),
            'net_profit_usd' => bcsub($grossProfit, $expenseTotal, 4),
        ];
    }

    private function buildExpenseBreakdown(Collection $expenses): Collection
    {
        return $expenses
            ->groupBy(fn (Expense $expense) => $expense->category ?: 'Other')
            ->map(fn (Collection $items, string $category) => [
                'category' => $category,
                'count' => $items->count(),
                'amount_usd' => $this->decimalize($items->sum('amount_usd')),
            ])
            ->sortByDesc('amount_usd')
            ->values();
    }

    private function buildCourierBreakdown(Collection $entries): Collection
    {
        return $entries
            ->filter(fn (array $entry) => ! empty($entry['delivery_company']))
            ->groupBy('delivery_company')
            ->map(fn (Collection $items, string $company) => [
                'company' => $company,
                'orders' => $items->count(),
                'delivery_cost_usd' => $this->decimalize($items->sum('delivery_cost_usd')),
                'revenue_usd' => $this->decimalize($items->sum('price_pack_usd')),
                'profit_usd' => $this->decimalize($items->sum('profit_usd')),
            ])
            ->sortByDesc('orders')
            ->values();
    }

    private function buildSourceBreakdown(Collection $entries): Collection
    {
        return $entries
            ->groupBy(fn (array $entry) => $entry['source_page'] ?: 'Other')
            ->map(fn (Collection $items, string $sourcePage) => [
                'source_page' => $sourcePage,
                'orders' => $items->count(),
                'qty_sold' => $items->sum('qty_sold'),
                'revenue_usd' => $this->decimalize($items->sum('price_pack_usd')),
                'profit_usd' => $this->decimalize($items->sum('profit_usd')),
            ])
            ->sortByDesc('orders')
            ->values();
    }

    private function buildMonthlyDailyLedger(Collection $entries, Collection $expenses): Collection
    {
        $expenseByDate = $expenses
            ->groupBy(fn (Expense $expense) => $expense->expense_date?->toDateString())
            ->map(fn (Collection $items) => (string) $items->sum('amount_usd'));

        return $entries
            ->groupBy('receipt_date')
            ->map(function (Collection $items, string $date) use ($expenseByDate) {
                $grossProfit = (string) $items->sum('profit_usd');
                $expenseTotal = $expenseByDate->get($date, '0');

                return [
                    'date' => $date,
                    'orders' => $items->count(),
                    'qty_sold' => $items->sum('qty_sold'),
                    'revenue_usd' => $this->decimalize($items->sum('total_usd')),
                    'gross_profit_usd' => $this->decimalize($grossProfit),
                    'expense_usd' => $this->decimalize($expenseTotal),
                    'net_profit_usd' => bcsub($grossProfit, $expenseTotal, 4),
                ];
            })
            ->sortKeys()
            ->values();
    }

    private function buildPurchaseBreakdown(Collection $purchases): Collection
    {
        return $purchases->map(fn (Purchase $purchase) => [
            'purchase_no' => $purchase->purchase_no,
            'purchase_date' => $purchase->purchase_date?->toDateString(),
            'arrival_date' => $purchase->arrival_date?->toDateString(),
            'supplier_name' => $purchase->supplier?->name,
            'status' => $purchase->status,
            'total_cost_usd' => (string) $purchase->total_cost_usd,
        ]);
    }

    private function describePriceMix(Collection $saleItems): string
    {
        return $saleItems
            ->filter(fn ($item) => $item->final_qty > 0)
            ->groupBy(fn ($item) => number_format((float) $item->unit_price_usd, 2, '.', ''))
            ->map(fn (Collection $items, string $price) => '$'.$price.' x '.$items->sum('final_qty'))
            ->values()
            ->implode(', ');
    }

    private function decimalize(float|int|string|null $value): string
    {
        return number_format((float) ($value ?? 0), 4, '.', '');
    }
}
