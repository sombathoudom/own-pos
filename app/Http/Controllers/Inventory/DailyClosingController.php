<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\DailyClosing;
use App\Models\Expense;
use App\Models\Sale;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DailyClosingController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->string('search')->toString();

        $closings = DailyClosing::query()
            ->when($search !== '', fn ($q) => $q->whereDate('closing_date', $search))
            ->orderByDesc('closing_date')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('inventory/daily-closings/index', [
            'closings' => $closings,
            'filters' => ['search' => $search],
        ]);
    }

    public function create(Request $request): Response
    {
        $date = $request->date('date') ?? now();

        $existingClosing = DailyClosing::where('closing_date', $date->toDateString())->first();
        if ($existingClosing) {
            return redirect()->route('daily-closings.show', $existingClosing)
                ->with('toast', ['type' => 'warning', 'message' => 'This day has already been closed.']);
        }

        $sales = Sale::query()
            ->whereDate('sale_date', $date)
            ->with('items')
            ->get();

        $expenses = Expense::query()
            ->whereDate('expense_date', $date)
            ->get();

        $totalOrders = $sales->count();
        $completedOrders = $sales->where('order_status', 'completed')->count();
        $cancelledOrders = $sales->where('order_status', 'cancelled')->count();
        $returnedOrders = $sales->whereIn('order_status', ['returned', 'partially_returned'])->count();
        $totalQtySold = $sales->sum(fn ($s) => $s->items->sum('qty'));
        $grossSales = (string) $sales->sum('subtotal_usd');
        $discount = (string) $sales->sum('discount_usd');
        $netSales = bcsub($grossSales, $discount, 4);
        $totalCogs = (string) $sales->sum(fn ($s) => $s->items->sum('cogs_usd'));
        $grossProfit = bcsub($netSales, $totalCogs, 4);
        $totalExpenses = (string) $expenses->sum('amount_usd');
        $netProfit = bcsub($grossProfit, $totalExpenses, 4);
        $cashUsd = (string) $sales->where('payment_status', 'paid')->sum('paid_usd');
        $unpaidUsd = (string) $sales->whereIn('payment_status', ['unpaid', 'partial'])->sum('total_usd');
        $refundUsd = (string) $sales->flatMap(fn ($s) => $s->returns)->sum('total_refund_usd');

        return Inertia::render('inventory/daily-closings/create', [
            'date' => $date->toDateString(),
            'preview' => [
                'total_orders' => $totalOrders,
                'completed_orders' => $completedOrders,
                'cancelled_orders' => $cancelledOrders,
                'returned_orders' => $returnedOrders,
                'total_qty_sold' => $totalQtySold,
                'gross_sales_usd' => $grossSales,
                'discount_usd' => $discount,
                'net_sales_usd' => $netSales,
                'total_cogs_usd' => $totalCogs,
                'gross_profit_usd' => $grossProfit,
                'total_expenses_usd' => $totalExpenses,
                'net_profit_usd' => $netProfit,
                'cash_usd' => $cashUsd,
                'unpaid_usd' => $unpaidUsd,
                'refund_usd' => $refundUsd,
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'closing_date' => ['required', 'date', 'unique:daily_closings,closing_date'],
            'total_orders' => ['required', 'integer'],
            'completed_orders' => ['required', 'integer'],
            'cancelled_orders' => ['required', 'integer'],
            'returned_orders' => ['required', 'integer'],
            'total_qty_sold' => ['required', 'integer'],
            'gross_sales_usd' => ['required', 'numeric'],
            'discount_usd' => ['required', 'numeric'],
            'net_sales_usd' => ['required', 'numeric'],
            'total_cogs_usd' => ['required', 'numeric'],
            'gross_profit_usd' => ['required', 'numeric'],
            'total_expenses_usd' => ['required', 'numeric'],
            'net_profit_usd' => ['required', 'numeric'],
            'cash_usd' => ['required', 'numeric'],
            'cash_khr' => ['nullable', 'numeric'],
            'bank_usd' => ['nullable', 'numeric'],
            'unpaid_usd' => ['required', 'numeric'],
            'refund_usd' => ['required', 'numeric'],
            'note' => ['nullable', 'string'],
        ]);

        DailyClosing::create([
            ...$validated,
            'closed_by' => auth()->id(),
            'closed_at' => now(),
            'status' => 'closed',
        ]);

        return to_route('daily-closings.index')->with('toast', ['type' => 'success', 'message' => 'Daily closing saved.']);
    }

    public function show(DailyClosing $dailyClosing): Response
    {
        return Inertia::render('inventory/daily-closings/show', [
            'closing' => $dailyClosing,
        ]);
    }
}
