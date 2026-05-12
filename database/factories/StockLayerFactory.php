<?php

namespace Database\Factories;

use App\Models\StockLayer;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<StockLayer>
 */
class StockLayerFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'original_qty' => fake()->numberBetween(10, 100),
            'remaining_qty' => fake()->numberBetween(10, 100),
            'unit_cost_usd' => fake()->randomFloat(4, 1, 10),
            'purchase_date' => fake()->date(),
        ];
    }
}
