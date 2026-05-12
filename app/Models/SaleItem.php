<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['sale_id', 'product_variant_id', 'qty', 'unit_price_usd', 'discount_usd', 'total_usd', 'cogs_usd', 'profit_usd'])]
class SaleItem extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return [
            'unit_price_usd' => 'decimal:4',
            'discount_usd' => 'decimal:4',
            'total_usd' => 'decimal:4',
            'cogs_usd' => 'decimal:4',
            'profit_usd' => 'decimal:4',
        ];
    }

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    public function productVariant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class);
    }

    public function costLayers(): HasMany
    {
        return $this->hasMany(SaleItemCostLayer::class);
    }
}
