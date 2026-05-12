<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['invoice_no', 'customer_name', 'customer_phone', 'sale_date', 'currency', 'exchange_rate', 'subtotal_usd', 'discount_usd', 'customer_delivery_fee_usd', 'actual_delivery_cost_usd', 'delivery_profit_usd', 'total_usd', 'paid_usd', 'payment_status', 'order_status', 'note', 'created_by'])]
class Sale extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return [
            'sale_date' => 'date',
            'exchange_rate' => 'decimal:4',
            'subtotal_usd' => 'decimal:4',
            'discount_usd' => 'decimal:4',
            'customer_delivery_fee_usd' => 'decimal:4',
            'actual_delivery_cost_usd' => 'decimal:4',
            'delivery_profit_usd' => 'decimal:4',
            'total_usd' => 'decimal:4',
            'paid_usd' => 'decimal:4',
        ];
    }

    public function items(): HasMany
    {
        return $this->hasMany(SaleItem::class);
    }

    public function returns(): HasMany
    {
        return $this->hasMany(SaleReturn::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function isDraft(): bool
    {
        return $this->order_status === 'draft';
    }

    public function isConfirmed(): bool
    {
        return $this->order_status === 'confirmed';
    }

    public function isCancelled(): bool
    {
        return $this->order_status === 'cancelled';
    }
}
