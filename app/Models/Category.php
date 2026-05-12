<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['name', 'default_sale_price_usd', 'description', 'status'])]
class Category extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return [
            'default_sale_price_usd' => 'decimal:4',
        ];
    }

    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }
}
