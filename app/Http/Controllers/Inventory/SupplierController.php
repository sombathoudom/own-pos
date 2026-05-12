<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Http\Requests\Inventory\StoreSupplierRequest;
use App\Http\Requests\Inventory\UpdateSupplierRequest;
use App\Models\Supplier;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SupplierController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->string('search')->toString();

        $suppliers = Supplier::query()
            ->when($search !== '', fn ($query) => $query->where('name', 'like', "%{$search}%"))
            ->orderBy('name')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('inventory/suppliers/index', [
            'suppliers' => $suppliers,
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('inventory/suppliers/create');
    }

    public function store(StoreSupplierRequest $request): RedirectResponse
    {
        Supplier::create($request->validated());

        return to_route('suppliers.index')->with('toast', ['type' => 'success', 'message' => 'Supplier created.']);
    }

    public function edit(Supplier $supplier): Response
    {
        return Inertia::render('inventory/suppliers/edit', [
            'supplier' => $supplier,
        ]);
    }

    public function update(UpdateSupplierRequest $request, Supplier $supplier): RedirectResponse
    {
        $supplier->update($request->validated());

        return to_route('suppliers.index')->with('toast', ['type' => 'success', 'message' => 'Supplier updated.']);
    }

    public function destroy(Supplier $supplier): RedirectResponse
    {
        $supplier->delete();

        return to_route('suppliers.index')->with('toast', ['type' => 'success', 'message' => 'Supplier deleted.']);
    }
}
