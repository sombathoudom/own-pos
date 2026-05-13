<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['sale_id', 'exchange_date', 'payment_received_date', 'exchange_delivery_fee_usd', 'exchange_delivery_cost_usd', 'subtotal_adjustment_usd', 'new_items_subtotal_usd', 'total_additional_amount_usd', 'additional_cogs_usd', 'additional_profit_usd', 'additional_qty_sold', 'note', 'created_by'])]
class SaleExchange extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return [
            'exchange_date' => 'date',
            'payment_received_date' => 'date',
            'exchange_delivery_fee_usd' => 'decimal:4',
            'exchange_delivery_cost_usd' => 'decimal:4',
            'subtotal_adjustment_usd' => 'decimal:4',
            'new_items_subtotal_usd' => 'decimal:4',
            'total_additional_amount_usd' => 'decimal:4',
            'additional_cogs_usd' => 'decimal:4',
            'additional_profit_usd' => 'decimal:4',
        ];
    }

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(SaleExchangeItem::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
