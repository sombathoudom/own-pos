<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Http\Requests\Inventory\StoreCustomerRequest;
use App\Http\Requests\Inventory\UpdateCustomerRequest;
use App\Models\Customer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CustomerController extends Controller
{
    public function search(Request $request): JsonResponse
    {
        $search = $request->string('search')->trim()->toString();

        $customers = Customer::query()
            ->where('status', 'active')
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($searchQuery) use ($search) {
                    $searchQuery
                        ->where('name', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%")
                        ->orWhere('address', 'like', "%{$search}%");
                });
            })
            ->orderBy('name')
            ->limit(20)
            ->get(['id', 'name', 'phone', 'address', 'status']);

        return response()->json([
            'data' => $customers,
        ]);
    }

    public function index(Request $request): Response
    {
        $search = $request->string('search')->toString();

        $customers = Customer::query()
            ->when($search !== '', fn ($query) => $query
                ->where('name', 'like', "%{$search}%")
                ->orWhere('phone', 'like', "%{$search}%"))
            ->orderBy('name')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('inventory/customers/index', [
            'customers' => $customers,
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('inventory/customers/create');
    }

    public function store(StoreCustomerRequest $request): RedirectResponse
    {
        $customer = Customer::create($request->validated());

        if ($request->string('redirect_to')->toString() === 'pos') {
            return to_route('pos')
                ->with('createdCustomer', [
                    'id' => $customer->id,
                    'name' => $customer->name,
                    'phone' => $customer->phone,
                    'address' => $customer->address,
                    'status' => $customer->status,
                ])
                ->with('toast', ['type' => 'success', 'message' => 'Customer created.']);
        }

        return to_route('customers.index')->with('toast', ['type' => 'success', 'message' => 'Customer created.']);
    }

    public function edit(Customer $customer): Response
    {
        return Inertia::render('inventory/customers/edit', [
            'customer' => $customer,
        ]);
    }

    public function update(UpdateCustomerRequest $request, Customer $customer): RedirectResponse
    {
        $customer->update($request->validated());

        return to_route('customers.index')->with('toast', ['type' => 'success', 'message' => 'Customer updated.']);
    }

    public function destroy(Customer $customer): RedirectResponse
    {
        $customer->delete();

        return to_route('customers.index')->with('toast', ['type' => 'success', 'message' => 'Customer deleted.']);
    }
}
