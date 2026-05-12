<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['product_variant_id', 'qty_on_hand'])]
class StockBalance extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected function casts(): array
    {
        return [
            'qty_on_hand' => 'integer',
        ];
    }

    public function productVariant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class);
    }

    public static function getOnHand(int $productVariantId): int
    {
        return static::where('product_variant_id', $productVariantId)
            ->value('qty_on_hand') ?? 0;
    }

    public static function incrementOnHand(int $productVariantId, int $qty): self
    {
        return static::updateOrCreate(
            ['product_variant_id' => $productVariantId],
            ['qty_on_hand' => static::getOnHand($productVariantId) + $qty],
        );
    }
}
