<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

#[Fillable(['product_variant_id', 'stock_layer_id', 'type', 'qty_change', 'reference_type', 'reference_id', 'unit_cost_usd', 'note', 'created_by'])]
class StockMovement extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return [
            'qty_change' => 'integer',
            'unit_cost_usd' => 'decimal:4',
        ];
    }

    public function productVariant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class);
    }

    public function stockLayer(): BelongsTo
    {
        return $this->belongsTo(StockLayer::class);
    }

    public function reference(): MorphTo
    {
        return $this->morphTo();
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function isInbound(): bool
    {
        return $this->qty_change > 0;
    }

    public function isOutbound(): bool
    {
        return $this->qty_change < 0;
    }
}
