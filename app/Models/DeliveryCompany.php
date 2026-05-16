<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['name', 'delivery_cost_usd', 'status', 'note'])]
class DeliveryCompany extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return [
            'delivery_cost_usd' => 'decimal:4',
        ];
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }
}
