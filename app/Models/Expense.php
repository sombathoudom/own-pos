<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['expense_date', 'category', 'amount_usd', 'amount_khr', 'currency', 'exchange_rate', 'note', 'created_by'])]
class Expense extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return [
            'expense_date' => 'date',
            'amount_usd' => 'decimal:4',
            'amount_khr' => 'decimal:4',
            'exchange_rate' => 'decimal:4',
        ];
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
