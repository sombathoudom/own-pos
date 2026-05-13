<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['closing_date', 'total_orders', 'completed_orders', 'cancelled_orders', 'returned_orders', 'total_qty_sold', 'gross_sales_usd', 'discount_usd', 'net_sales_usd', 'total_cogs_usd', 'gross_profit_usd', 'total_expenses_usd', 'net_profit_usd', 'cash_usd', 'cash_khr', 'bank_usd', 'unpaid_usd', 'refund_usd', 'closed_by', 'closed_at', 'status', 'note'])]
class DailyClosing extends Model
{
    use Auditable, HasFactory;

    protected function casts(): array
    {
        return [
            'closing_date' => 'date',
            'gross_sales_usd' => 'decimal:4',
            'discount_usd' => 'decimal:4',
            'net_sales_usd' => 'decimal:4',
            'total_cogs_usd' => 'decimal:4',
            'gross_profit_usd' => 'decimal:4',
            'total_expenses_usd' => 'decimal:4',
            'net_profit_usd' => 'decimal:4',
            'cash_usd' => 'decimal:4',
            'cash_khr' => 'decimal:4',
            'bank_usd' => 'decimal:4',
            'unpaid_usd' => 'decimal:4',
            'refund_usd' => 'decimal:4',
            'closed_at' => 'datetime',
        ];
    }

    public function closedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'closed_by');
    }
}
