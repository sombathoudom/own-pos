<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'sale_id',
    'confirmation_date',
    'original_product_total_usd',
    'final_product_total_usd',
    'original_delivery_fee_usd',
    'final_delivery_fee_usd',
    'discount_usd',
    'final_total_usd',
    'delivery_fee_note',
    'status',
    'note',
    'confirmed_by',
])]
class DeliveryConfirmation extends Model
{
    protected function casts(): array
    {
        return [
            'confirmation_date' => 'date',
            'original_product_total_usd' => 'decimal:4',
            'final_product_total_usd' => 'decimal:4',
            'original_delivery_fee_usd' => 'decimal:4',
            'final_delivery_fee_usd' => 'decimal:4',
            'discount_usd' => 'decimal:4',
            'final_total_usd' => 'decimal:4',
        ];
    }

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(DeliveryConfirmationItem::class);
    }

    public function confirmedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'confirmed_by');
    }
}
