<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['name', 'phone', 'address', 'status'])]
class Customer extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return [];
    }

    public function sales(): HasMany
    {
        return $this->hasMany(Sale::class);
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }
}
