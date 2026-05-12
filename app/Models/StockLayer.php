<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['purchase_item_id', 'product_variant_id', 'original_qty', 'remaining_qty', 'unit_cost_usd', 'purchase_date'])]
class StockLayer extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return [
            'original_qty' => 'integer',
            'remaining_qty' => 'integer',
            'unit_cost_usd' => 'decimal:4',
            'purchase_date' => 'date',
        ];
    }

    public function purchaseItem(): BelongsTo
    {
        return $this->belongsTo(PurchaseItem::class);
    }

    public function productVariant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class);
    }

    public function stockMovements(): HasMany
    {
        return $this->hasMany(StockMovement::class);
    }

    public function isDepleted(): bool
    {
        return $this->remaining_qty <= 0;
    }
}
