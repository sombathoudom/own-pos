<?php

namespace App\Http\Requests\Inventory;

use Illuminate\Foundation\Http\FormRequest;

class StoreSaleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'customer_name' => ['nullable', 'string', 'max:255'],
            'customer_phone' => ['nullable', 'string', 'max:50'],
            'customer_address' => ['nullable', 'string', 'max:500'],
            'source_page' => ['nullable', 'string', 'in:DL,DC,Walk-in,Other'],
            'sale_date' => ['required', 'date'],
            'currency' => ['sometimes', 'string', 'size:3'],
            'exchange_rate' => ['sometimes', 'numeric', 'min:0'],
            'discount_usd' => ['sometimes', 'numeric', 'min:0'],
            'customer_delivery_fee_usd' => ['sometimes', 'numeric', 'min:0'],
            'actual_delivery_cost_usd' => ['sometimes', 'numeric', 'min:0'],
            'paid_usd' => ['sometimes', 'numeric', 'min:0'],
            'note' => ['nullable', 'string', 'max:2000'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_variant_id' => ['required', 'exists:product_variants,id'],
            'items.*.qty' => ['required', 'integer', 'min:1'],
            'items.*.unit_price_usd' => ['required', 'numeric', 'min:0'],
            'items.*.discount_usd' => ['sometimes', 'numeric', 'min:0'],
        ];
    }
}
