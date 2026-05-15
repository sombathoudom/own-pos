<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['product_id', 'sku', 'barcode', 'style_name', 'color', 'size', 'sale_price_usd', 'status'])]
class ProductVariant extends Model
{
    use Auditable, HasFactory;

    protected function casts(): array
    {
        return [
            'sale_price_usd' => 'decimal:4',
        ];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function stockBalance()
    {
        return $this->hasOne(StockBalance::class);
    }

    public function stockLayers(): HasMany
    {
        return $this->hasMany(StockLayer::class);
    }

    public function stockMovements(): HasMany
    {
        return $this->hasMany(StockMovement::class);
    }

    public function purchaseItems(): HasMany
    {
        return $this->hasMany(PurchaseItem::class);
    }

    public function currentStock(): int
    {
        return $this->stockBalance?->qty_on_hand ?? 0;
    }

    public function displayName(): string
    {
        $parts = array_filter([$this->product?->name, $this->color, $this->size]);

        return implode(' - ', $parts) ?: $this->sku;
    }

    public function scopeProductWithSizes($query)
    {
        return $query
            ->orderBy('product_id')
            ->sizeOrdered()
            ->orderBy('sku');
    }

    public function scopeSizeOrdered($query)
    {
        return $query->orderByRaw("
            CASE 
                WHEN UPPER(TRIM(size)) IN ('FREESIZE', 'FREE SIZE', 'ONE SIZE', 'OS', 'F') THEN 50
                WHEN size = 'XS'  THEN 1
                WHEN size = 'S'   THEN 2
                WHEN size = 'M'   THEN 3
                WHEN size = 'L'   THEN 4
                WHEN size = 'XL'  THEN 5
                WHEN size IN ('XXL', '2XL') THEN 6
                WHEN size IN ('3XL', 'XXXL') THEN 7
                WHEN size = '4XL' THEN 8
                WHEN size = '5XL' THEN 9
                ELSE 999
            END
        ");
    }
}
