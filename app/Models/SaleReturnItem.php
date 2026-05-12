<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['sale_return_id', 'sale_item_id', 'product_variant_id', 'qty', 'unit_price_usd', 'refund_usd', 'cogs_usd'])]
class SaleReturnItem extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return [
            'unit_price_usd' => 'decimal:4',
            'refund_usd' => 'decimal:4',
            'cogs_usd' => 'decimal:4',
        ];
    }

    public function saleReturn(): BelongsTo
    {
        return $this->belongsTo(SaleReturn::class);
    }

    public function saleItem(): BelongsTo
    {
        return $this->belongsTo(SaleItem::class);
    }

    public function productVariant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class);
    }
}
