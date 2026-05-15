<?php

namespace App\Http\Controllers;

use App\Models\DailyClosing;
use App\Models\Expense;
use App\Models\ProductVariant;
use App\Models\Sale;
use App\Models\SaleExchange;
use App\Models\SaleItem;
use App\Models\SaleReturn;
use App\Models\StockBalance;
use Carbon\CarbonInterface;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(): Response
    {
        $today = now()->startOfDay();
        $monthStart = now()->startOfMonth();
        $monthEnd = now()->endOfMonth();

        return Inertia::render('dashboard', [
            'summary' => [
                'today_sales_usd' => $this->formatMoney($this->netRevenueForPeriod($today, $today)),
                'today_orders' => $this->salesReceiptCountForPeriod($today, $today),
                'month_sales_usd' => $this->formatMoney($this->netRevenueForPeriod($monthStart, $monthEnd)),
                'total_sales_usd' => $this->formatMoney($this->netRevenueForPeriod()),
                'outstanding_usd' => $this->formatMoney($this->outstandingAmount()),
                'low_stock_items' => $this->lowStockCount(),
                'today_expenses_usd' => $this->formatMoney($this->expenseTotalForPeriod($today, $today)),
                'today_closing_status' => $this->todayClosingStatus($today),
            ],
            'sales_trend' => $this->salesTrend(),
            'payment_breakdown' => $this->paymentBreakdown(),
            'top_products' => $this->topProducts(),
            'recent_sales' => $this->recentSales(),
            'low_stock_watchlist' => $this->lowStockWatchlist(),
        ]);
    }

    /**
     * @return array<int, array<string, int|string>>
     */
    private function salesTrend(): array
    {
        return collect(range(6, 0))
            ->map(function (int $daysAgo) {
                $date = now()->subDays($daysAgo)->startOfDay();

                return [
                    'date' => $date->toDateString(),
                    'label' => $date->format('M j'),
                    'sales_usd' => $this->formatMoney($this->netRevenueForPeriod($date, $date)),
                    'expenses_usd' => $this->formatMoney($this->expenseTotalForPeriod($date, $date)),
                    'orders' => $this->salesReceiptCountForPeriod($date, $date),
                ];
            })
            ->values()
            ->all();
    }

    private function netRevenueForPeriod(?CarbonInterface $from = null, ?CarbonInterface $to = null): float
    {
        $baseSales = Sale::query()
            ->where('payment_status', 'paid')
            ->whereNotNull('payment_received_date');

        $exchangeSales = SaleExchange::query();
        $returns = SaleReturn::query();

        if ($from && $to) {
            $this->applyDateFilter($baseSales, 'payment_received_date', $from, $to);
            $this->applyDateFilter($exchangeSales, 'payment_received_date', $from, $to);
            $this->applyDateFilter($returns, 'payment_received_date', $from, $to);
        }

        $baseRevenue = (float) $baseSales->get()->sum(fn (Sale $sale) => $this->baseSaleRevenue($sale));
        $exchangeRevenue = (float) $exchangeSales->sum('total_additional_amount_usd');
        $refunds = (float) $returns->sum('total_refund_usd');

        return round($baseRevenue + $exchangeRevenue - $refunds, 2);
    }

    private function salesReceiptCountForPeriod(CarbonInterface $from, CarbonInterface $to): int
    {
        $query = Sale::query()
            ->where('payment_status', 'paid')
            ->whereNotNull('payment_received_date');

        $this->applyDateFilter($query, 'payment_received_date', $from, $to);

        return $query->count();
    }

    private function outstandingAmount(): float
    {
        return (float) Sale::query()
            ->whereIn('payment_status', ['partial', 'unpaid'])
            ->where('order_status', '!=', 'cancelled')
            ->get()
            ->sum(fn (Sale $sale) => max(0, (float) $sale->total_usd - (float) $sale->paid_usd));
    }

    private function expenseTotalForPeriod(CarbonInterface $from, CarbonInterface $to): float
    {
        $query = Expense::query();

        $this->applyDateFilter($query, 'expense_date', $from, $to);

        return (float) $query->sum('amount_usd');
    }

    private function todayClosingStatus(CarbonInterface $today): string
    {
        return DailyClosing::query()
            ->whereDate('closing_date', $today->toDateString())
            ->exists() ? 'Closed' : 'Open';
    }

    /**
     * @return array<int, array<string, int|string>>
     */
    private function paymentBreakdown(): array
    {
        return Sale::query()
            ->select('payment_status', DB::raw('COUNT(*) as total'))
            ->where('order_status', '!=', 'cancelled')
            ->groupBy('payment_status')
            ->orderByRaw("CASE payment_status WHEN 'paid' THEN 1 WHEN 'partial' THEN 2 ELSE 3 END")
            ->get()
            ->map(fn (Sale $sale) => [
                'status' => $sale->payment_status,
                'total' => (int) $sale->total,
            ])
            ->all();
    }

    /**
     * @return array<int, array<string, int|string|null>>
     */
    private function topProducts(): array
    {
        return SaleItem::query()
            ->selectRaw('product_variants.id as variant_id')
            ->selectRaw('products.name as product_name')
            ->selectRaw('product_variants.sku, product_variants.color, product_variants.size')
            ->selectRaw('COALESCE(stock_balances.qty_on_hand, 0) as stock_on_hand')
            ->selectRaw('SUM(sale_items.final_qty) as qty_sold')
            ->selectRaw('SUM(sale_items.total_usd) as revenue_usd')
            ->join('sales', 'sales.id', '=', 'sale_items.sale_id')
            ->join('product_variants', 'product_variants.id', '=', 'sale_items.product_variant_id')
            ->join('products', 'products.id', '=', 'product_variants.product_id')
            ->leftJoin('stock_balances', 'stock_balances.product_variant_id', '=', 'product_variants.id')
            ->whereNotNull('sales.delivery_completed_date')
            ->where('sales.order_status', '!=', 'cancelled')
            ->where('sale_items.final_qty', '>', 0)
            ->groupBy('product_variants.id', 'products.name', 'product_variants.sku', 'product_variants.color', 'product_variants.size', 'stock_balances.qty_on_hand')
            ->orderByDesc('qty_sold')
            ->orderByDesc('revenue_usd')
            ->limit(5)
            ->get()
            ->map(fn (SaleItem $item) => [
                'variant_id' => (int) $item->variant_id,
                'product_name' => $item->product_name,
                'sku' => $item->sku,
                'color' => $item->color,
                'size' => $item->size,
                'stock_on_hand' => (int) $item->stock_on_hand,
                'qty_sold' => (int) $item->qty_sold,
                'revenue_usd' => $this->formatMoney((float) $item->revenue_usd),
            ])
            ->all();
    }

    /**
     * @return array<int, array<string, int|string|null>>
     */
    private function recentSales(): array
    {
        return Sale::query()
            ->whereNotNull('payment_received_date')
            ->orderByDesc('payment_received_date')
            ->orderByDesc('id')
            ->limit(8)
            ->get()
            ->map(fn (Sale $sale) => [
                'id' => $sale->id,
                'invoice_no' => $sale->invoice_no,
                'customer_name' => $sale->customer_name,
                'payment_received_date' => $sale->payment_received_date?->toDateString(),
                'total_usd' => $this->formatMoney((float) $sale->total_usd),
                'paid_usd' => $this->formatMoney((float) $sale->paid_usd),
                'payment_status' => $sale->payment_status,
                'order_status' => $sale->order_status,
            ])
            ->all();
    }

    /**
     * @return array<int, array<string, int|string|null>>
     */
    private function lowStockWatchlist(): array
    {
        return StockBalance::query()
            ->with('productVariant.product')
            ->where('qty_on_hand', '<=', 5)
            ->orderBy('qty_on_hand')
            ->orderBy('product_variant_id')
            ->limit(6)
            ->get()
            ->map(fn (StockBalance $balance) => [
                'variant_id' => $balance->product_variant_id,
                'product_name' => $balance->productVariant?->product?->name,
                'sku' => $balance->productVariant?->sku,
                'color' => $balance->productVariant?->color,
                'size' => $balance->productVariant?->size,
                'qty_on_hand' => $balance->qty_on_hand,
            ])
            ->all();
    }

    private function lowStockCount(): int
    {
        return ProductVariant::query()
            ->whereHas('stockBalance', fn ($query) => $query->where('qty_on_hand', '<=', 5))
            ->count();
    }

    private function applyDateFilter($query, string $column, CarbonInterface $from, CarbonInterface $to): void
    {
        if ($from->isSameDay($to)) {
            $query->whereDate($column, $from->toDateString());

            return;
        }

        $query->whereBetween($column, [$from->toDateString(), $to->toDateString()]);
    }

    private function baseSaleRevenue(Sale $sale): float
    {
        $exchangeAdditions = (float) $sale->exchanges()->sum('total_additional_amount_usd');
        $returnDeductions = (float) $sale->returns()->sum('total_refund_usd');

        return round((float) $sale->total_usd + $returnDeductions - $exchangeAdditions, 2);
    }

    private function formatMoney(float $amount): string
    {
        return number_format($amount, 2, '.', '');
    }
}
