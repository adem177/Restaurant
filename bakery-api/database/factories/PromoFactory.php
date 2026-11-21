<?php

namespace Database\Factories;

use App\Models\Promo;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Promo>
 */
class PromoFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'code' => strtoupper($this->faker->unique()->bothify('BAKERY-####')),
            'type' => 'percent',
            'value' => 10,
            'min_total' => null,
            'starts_at' => null,
            'expires_at' => null,
            'max_uses' => null,
            'used_count' => 0,
            'is_active' => true,
        ];
    }

    public function fixed(): static
    {
        return $this->state(['type' => 'fixed', 'value' => 5]);
    }

    public function inactive(): static
    {
        return $this->state(['is_active' => false]);
    }
}
