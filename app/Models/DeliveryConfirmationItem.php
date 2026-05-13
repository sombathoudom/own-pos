<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'delivery_confirmation_id',
    'sale_item_id',
    'original_product_variant_id',
    'final_product_variant_id',
    'original_qty',
    'accepted_qty',
    'rejected_qty',
    'added_qty',
    'unit_price_usd',
    'final_total_usd',
    'action_type',
    'return_to_stock',
    'condition',
    'note',
])]
class DeliveryConfirmationItem extends Model
{
    protected function casts(): array
    {
        return [
            'unit_price_usd' => 'decimal:4',
            'final_total_usd' => 'decimal:4',
            'return_to_stock' => 'boolean',
        ];
    }

    public function deliveryConfirmation(): BelongsTo
    {
        return $this->belongsTo(DeliveryConfirmation::class);
    }

    public function saleItem(): BelongsTo
    {
        return $this->belongsTo(SaleItem::class);
    }

    public function originalVariant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class, 'original_product_variant_id');
    }

    public function finalVariant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class, 'final_product_variant_id');
    }
}
