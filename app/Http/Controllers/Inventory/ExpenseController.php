<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use App\Services\DailyClosingLock;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ExpenseController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->string('search')->toString();
        $from = $request->date('from');
        $to = $request->date('to');

        $expenses = Expense::query()
            ->when($search !== '', fn ($q) => $q->where('category', 'like', "%{$search}%"))
            ->when($from, fn ($q) => $q->whereDate('expense_date', '>=', $from))
            ->when($to, fn ($q) => $q->whereDate('expense_date', '<=', $to))
            ->orderByDesc('expense_date')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('inventory/expenses/index', [
            'expenses' => $expenses,
            'filters' => [
                'search' => $search,
                'from' => $from?->toDateString(),
                'to' => $to?->toDateString(),
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('inventory/expenses/create');
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'expense_date' => ['required', 'date'],
            'category' => ['required', 'string', 'max:30'],
            'amount_usd' => ['required', 'numeric', 'min:0'],
            'amount_khr' => ['nullable', 'numeric', 'min:0'],
            'currency' => ['required', 'string', 'max:3'],
            'exchange_rate' => ['required', 'numeric', 'min:0'],
            'note' => ['nullable', 'string'],
        ]);

        try {
            DailyClosingLock::ensureNotLocked($validated['expense_date'], 'This day has been closed. Expenses cannot be added.');
        } catch (\RuntimeException $e) {
            return back()->withErrors(['general' => $e->getMessage()]);
        }

        Expense::create([
            ...$validated,
            'created_by' => auth()->id(),
        ]);

        return to_route('expenses.index')->with('toast', ['type' => 'success', 'message' => 'Expense recorded.']);
    }

    public function edit(Expense $expense): Response
    {
        return Inertia::render('inventory/expenses/edit', [
            'expense' => $expense,
        ]);
    }

    public function update(Request $request, Expense $expense): RedirectResponse
    {
        $validated = $request->validate([
            'expense_date' => ['required', 'date'],
            'category' => ['required', 'string', 'max:30'],
            'amount_usd' => ['required', 'numeric', 'min:0'],
            'amount_khr' => ['nullable', 'numeric', 'min:0'],
            'currency' => ['required', 'string', 'max:3'],
            'exchange_rate' => ['required', 'numeric', 'min:0'],
            'note' => ['nullable', 'string'],
        ]);

        try {
            DailyClosingLock::ensureNotLocked($validated['expense_date'], 'This day has been closed. Expenses cannot be modified.');
        } catch (\RuntimeException $e) {
            return back()->withErrors(['general' => $e->getMessage()]);
        }

        $expense->update($validated);

        return to_route('expenses.index')->with('toast', ['type' => 'success', 'message' => 'Expense updated.']);
    }

    public function destroy(Expense $expense): RedirectResponse
    {
        try {
            DailyClosingLock::ensureNotLocked($expense->expense_date, 'This day has been closed. Expenses cannot be deleted.');
        } catch (\RuntimeException $e) {
            return back()->withErrors(['general' => $e->getMessage()]);
        }

        $expense->delete();

        return to_route('expenses.index')->with('toast', ['type' => 'success', 'message' => 'Expense deleted.']);
    }
}
