<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['supplier_id', 'purchase_no', 'purchase_date', 'arrival_date', 'currency', 'exchange_rate', 'subtotal_usd', 'purchase_delivery_cost_usd', 'other_cost_usd', 'total_cost_usd', 'allocation_method', 'status', 'note', 'created_by'])]
class Purchase extends Model
{
    use Auditable, HasFactory;

    protected function casts(): array
    {
        return [
            'purchase_date' => 'date',
            'arrival_date' => 'date',
            'exchange_rate' => 'decimal:4',
            'subtotal_usd' => 'decimal:4',
            'purchase_delivery_cost_usd' => 'decimal:4',
            'other_cost_usd' => 'decimal:4',
            'total_cost_usd' => 'decimal:4',
        ];
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(PurchaseItem::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function isInTransit(): bool
    {
        return $this->status === 'in_transit';
    }

    public function isArrived(): bool
    {
        return $this->status === 'arrived';
    }

    public function isDraft(): bool
    {
        return $this->status === 'draft';
    }

    public function isConfirmed(): bool
    {
        return $this->status === 'arrived';
    }
}
