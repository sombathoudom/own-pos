<?php

namespace Database\Factories;

use App\Models\Purchase;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Purchase>
 */
class PurchaseFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'purchase_no' => fake()->unique()->bothify('PO-####'),
            'purchase_date' => fake()->date(),
            'currency' => 'USD',
            'exchange_rate' => 1,
            'subtotal_usd' => 0,
            'purchase_delivery_cost_usd' => 0,
            'other_cost_usd' => 0,
            'total_cost_usd' => 0,
            'allocation_method' => 'by_qty',
            'status' => 'draft',
            'note' => fake()->optional()->sentence(),
        ];
    }
}
