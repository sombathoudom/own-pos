<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['sale_item_id', 'stock_layer_id', 'qty', 'unit_cost_usd', 'total_cost_usd'])]
class SaleItemCostLayer extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return [
            'unit_cost_usd' => 'decimal:4',
            'total_cost_usd' => 'decimal:4',
        ];
    }

    public function saleItem(): BelongsTo
    {
        return $this->belongsTo(SaleItem::class);
    }

    public function stockLayer(): BelongsTo
    {
        return $this->belongsTo(StockLayer::class);
    }
}
