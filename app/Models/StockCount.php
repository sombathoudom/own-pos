<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['count_date', 'status', 'counted_by', 'note'])]
class StockCount extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return [
            'count_date' => 'date',
        ];
    }

    public function countedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'counted_by');
    }

    public function items(): HasMany
    {
        return $this->hasMany(StockCountItem::class);
    }
}
