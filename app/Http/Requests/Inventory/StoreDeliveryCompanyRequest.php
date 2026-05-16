<?php

namespace App\Http\Requests\Inventory;

use Illuminate\Foundation\Http\FormRequest;

class StoreDeliveryCompanyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'delivery_cost_usd' => ['required', 'numeric', 'min:0'],
            'status' => ['sometimes', 'in:active,inactive'],
            'note' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
