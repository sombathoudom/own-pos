<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Http\Requests\Inventory\StoreDeliveryCompanyRequest;
use App\Http\Requests\Inventory\UpdateDeliveryCompanyRequest;
use App\Models\DeliveryCompany;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DeliveryCompanyController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->string('search')->toString();

        $companies = DeliveryCompany::query()
            ->when($search !== '', fn ($query) => $query->where('name', 'like', "%{$search}%"))
            ->orderBy('name')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('inventory/delivery-companies/index', [
            'companies' => $companies,
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('inventory/delivery-companies/create');
    }

    public function store(StoreDeliveryCompanyRequest $request): RedirectResponse
    {
        DeliveryCompany::create($request->validated());

        return to_route('delivery-companies.index')->with('toast', ['type' => 'success', 'message' => 'Delivery company created.']);
    }

    public function edit(DeliveryCompany $deliveryCompany): Response
    {
        return Inertia::render('inventory/delivery-companies/edit', [
            'company' => $deliveryCompany,
        ]);
    }

    public function update(UpdateDeliveryCompanyRequest $request, DeliveryCompany $deliveryCompany): RedirectResponse
    {
        $deliveryCompany->update($request->validated());

        return to_route('delivery-companies.index')->with('toast', ['type' => 'success', 'message' => 'Delivery company updated.']);
    }

    public function destroy(DeliveryCompany $deliveryCompany): RedirectResponse
    {
        $deliveryCompany->delete();

        return to_route('delivery-companies.index')->with('toast', ['type' => 'success', 'message' => 'Delivery company deleted.']);
    }
}
