<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['sale_id', 'delivery_company', 'tracking_no', 'customer_delivery_fee_usd', 'actual_delivery_cost_usd', 'delivery_profit_usd', 'delivery_status', 'delivered_at', 'failed_reason', 'note'])]
class OrderDelivery extends Model
{
    use HasFactory;

    protected $table = 'orders_delivery';

    protected function casts(): array
    {
        return [
            'customer_delivery_fee_usd' => 'decimal:4',
            'actual_delivery_cost_usd' => 'decimal:4',
            'delivery_profit_usd' => 'decimal:4',
            'delivered_at' => 'datetime',
        ];
    }

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }
}
