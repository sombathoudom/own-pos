<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['purchase_id', 'category_id', 'product_id', 'product_variant_id', 'qty', 'unit_cost_usd', 'subtotal_usd', 'allocated_delivery_cost_usd', 'allocated_other_cost_usd', 'landed_unit_cost_usd', 'total_landed_cost_usd', 'sale_price_usd', 'expected_profit_per_unit_usd'])]
class PurchaseItem extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return [
            'qty' => 'integer',
            'unit_cost_usd' => 'decimal:4',
            'subtotal_usd' => 'decimal:4',
            'allocated_delivery_cost_usd' => 'decimal:4',
            'allocated_other_cost_usd' => 'decimal:4',
            'landed_unit_cost_usd' => 'decimal:4',
            'total_landed_cost_usd' => 'decimal:4',
            'sale_price_usd' => 'decimal:4',
            'expected_profit_per_unit_usd' => 'decimal:4',
        ];
    }

    public function purchase(): BelongsTo
    {
        return $this->belongsTo(Purchase::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function productVariant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class);
    }

    public function stockLayer()
    {
        return $this->hasOne(StockLayer::class);
    }
}
