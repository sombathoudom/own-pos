<?php

namespace App\Http\Requests\Inventory;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'category_id' => ['sometimes', 'required', 'exists:categories,id'],
            'description' => ['nullable', 'string', 'max:1000'],
            'image' => ['nullable', 'image', 'max:5120'],
            'remove_image' => ['sometimes', 'boolean'],
            'status' => ['sometimes', 'in:active,inactive'],
            'new_variants' => ['sometimes', 'array'],
            'new_variants.*.sku' => ['required', 'string', 'max:100', 'distinct', 'unique:product_variants,sku'],
            'new_variants.*.style_name' => ['nullable', 'string', 'max:255'],
            'new_variants.*.color' => ['nullable', 'string', 'max:100'],
            'new_variants.*.size' => ['required', 'string', 'max:50'],
            'new_variants.*.sale_price_usd' => ['required', 'numeric', 'min:0'],
        ];
    }
}
