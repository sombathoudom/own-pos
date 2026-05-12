<?php

namespace Database\Factories;

use App\Models\PurchaseItem;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PurchaseItem>
 */
class PurchaseItemFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'qty' => fake()->numberBetween(5, 50),
            'unit_cost_usd' => fake()->randomFloat(4, 1, 10),
            'subtotal_usd' => 0,
            'allocated_delivery_cost_usd' => 0,
            'allocated_other_cost_usd' => 0,
            'landed_unit_cost_usd' => 0,
            'total_landed_cost_usd' => 0,
            'sale_price_usd' => fake()->randomElement([6.00, 8.00, 15.00]),
            'expected_profit_per_unit_usd' => 0,
        ];
    }
}
