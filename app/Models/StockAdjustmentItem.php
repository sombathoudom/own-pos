<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['stock_adjustment_id', 'product_variant_id', 'system_qty', 'actual_qty', 'difference_qty', 'movement_type', 'note'])]
class StockAdjustmentItem extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return [
            'system_qty' => 'integer',
            'actual_qty' => 'integer',
            'difference_qty' => 'integer',
        ];
    }

    public function stockAdjustment(): BelongsTo
    {
        return $this->belongsTo(StockAdjustment::class);
    }

    public function productVariant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class);
    }
}
