<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['product_id', 'sku', 'barcode', 'style_name', 'color', 'size', 'sale_price_usd', 'status'])]
class ProductVariant extends Model
{
    use HasFactory;

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
}
