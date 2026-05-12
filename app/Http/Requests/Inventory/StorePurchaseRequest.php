<?php

namespace App\Http\Requests\Inventory;

use Illuminate\Foundation\Http\FormRequest;

class StorePurchaseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'supplier_id' => ['nullable', 'exists:suppliers,id'],
            'purchase_date' => ['required', 'date'],
            'arrival_date' => ['nullable', 'date', 'after_or_equal:purchase_date'],
            'currency' => ['sometimes', 'string', 'size:3'],
            'exchange_rate' => ['sometimes', 'numeric', 'min:0'],
            'purchase_delivery_cost_usd' => ['sometimes', 'numeric', 'min:0'],
            'other_cost_usd' => ['sometimes', 'numeric', 'min:0'],
            'allocation_method' => ['sometimes', 'in:by_qty'],
            'note' => ['nullable', 'string', 'max:2000'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.category_id' => ['required', 'exists:categories,id'],
            'items.*.product_id' => ['required', 'exists:products,id'],
            'items.*.product_variant_id' => ['required', 'exists:product_variants,id'],
            'items.*.qty' => ['required', 'integer', 'min:1'],
            'items.*.unit_cost_usd' => ['required', 'numeric', 'min:0'],
            'items.*.sale_price_usd' => ['required', 'numeric', 'min:0'],
        ];
    }
}
