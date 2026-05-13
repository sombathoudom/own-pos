<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['sale_exchange_id', 'sale_item_id', 'qty_returned', 'new_variant_id', 'new_unit_price_usd', 'new_sale_item_id'])]
class SaleExchangeItem extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return [
            'new_unit_price_usd' => 'decimal:4',
        ];
    }

    public function saleExchange(): BelongsTo
    {
        return $this->belongsTo(SaleExchange::class);
    }

    public function saleItem(): BelongsTo
    {
        return $this->belongsTo(SaleItem::class);
    }

    public function newVariant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class, 'new_variant_id');
    }

    public function newSaleItem(): BelongsTo
    {
        return $this->belongsTo(SaleItem::class, 'new_sale_item_id');
    }
}
