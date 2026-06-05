<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;

#[Fillable(['category_id', 'name', 'description', 'image_path', 'status'])]
class Product extends Model
{
    use Auditable, HasFactory;

    public function imageUrl(int $width = 400): ?string
    {
        if (! $this->image_path) {
            return null;
        }

        $width = max(100, min($width, 1600));

        return route('product-image', [
            'filename' => basename($this->image_path),
            'w' => $width,
        ]);
    }

    /**
     * Return the original full-size image URL.
     */
    public function originalImageUrl(): ?string
    {
        if (! $this->image_path) {
            return null;
        }

        return Storage::disk('public')->url($this->image_path);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function variants(): HasMany
    {
        return $this->hasMany(ProductVariant::class);
    }
}
