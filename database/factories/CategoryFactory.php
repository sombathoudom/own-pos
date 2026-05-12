<?php

namespace Database\Factories;

use App\Models\Category;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Category>
 */
class CategoryFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->unique()->words(2, true),
            'default_sale_price_usd' => fake()->randomElement([6.00, 8.00, 15.00]),
            'description' => fake()->optional()->sentence(),
            'status' => 'active',
        ];
    }
}
