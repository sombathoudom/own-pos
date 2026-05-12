<?php

namespace Database\Factories;

use App\Models\ProductVariant;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ProductVariant>
 */
class ProductVariantFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'sku' => fake()->unique()->bothify('SKU-####'),
            'barcode' => fake()->optional()->ean13(),
            'style_name' => fake()->optional()->words(2, true),
            'color' => fake()->optional()->colorName(),
            'size' => fake()->randomElement(['S', 'M', 'L', 'XL', '2XL']),
            'sale_price_usd' => fake()->randomElement([6.00, 8.00, 15.00]),
            'status' => 'active',
        ];
    }
}
