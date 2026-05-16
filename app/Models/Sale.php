<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

#[Fillable(['invoice_no', 'customer_name', 'customer_phone', 'customer_address', 'source_page', 'delivery_company_id', 'sale_date', 'currency', 'exchange_rate', 'original_subtotal_usd', 'subtotal_usd', 'discount_usd', 'original_delivery_fee_usd', 'customer_delivery_fee_usd', 'actual_delivery_cost_usd', 'delivery_profit_usd', 'original_total_usd', 'total_usd', 'paid_usd', 'payment_received_date', 'delivery_completed_date', 'payment_status', 'order_status', 'note', 'created_by'])]
class Sale extends Model
{
    use Auditable, HasFactory;

    protected function casts(): array
    {
        return [
            'sale_date' => 'date',
            'payment_received_date' => 'date',
            'delivery_completed_date' => 'date',
            'exchange_rate' => 'decimal:4',
            'original_subtotal_usd' => 'decimal:4',
            'subtotal_usd' => 'decimal:4',
            'discount_usd' => 'decimal:4',
            'original_delivery_fee_usd' => 'decimal:4',
            'customer_delivery_fee_usd' => 'decimal:4',
            'actual_delivery_cost_usd' => 'decimal:4',
            'delivery_profit_usd' => 'decimal:4',
            'original_total_usd' => 'decimal:4',
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

    public function deliveryCompany(): BelongsTo
    {
        return $this->belongsTo(DeliveryCompany::class);
    }

    public function cancellation(): HasOne
    {
        return $this->hasOne(SaleCancellation::class);
    }

    public function delivery(): HasOne
    {
        return $this->hasOne(OrderDelivery::class);
    }

    public function packagingLogs(): HasMany
    {
        return $this->hasMany(PackagingLog::class);
    }

    public function exchanges(): HasMany
    {
        return $this->hasMany(SaleExchange::class);
    }

    public function deliveryConfirmations(): HasMany
    {
        return $this->hasMany(DeliveryConfirmation::class);
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

    public function isDeliveryCompleted(): bool
    {
        return $this->delivery_completed_date !== null;
    }
}
