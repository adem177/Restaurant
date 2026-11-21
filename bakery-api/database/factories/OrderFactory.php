<?php

namespace Database\Factories;

use App\Models\Order;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Order>
 */
class OrderFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'customer_name' => $this->faker->name(),
            'customer_phone' => $this->faker->phoneNumber(),
            'customer_email' => $this->faker->safeEmail(),
            'type' => $this->faker->randomElement(['pickup', 'delivery']),
            'address' => $this->faker->address(),
            'status' => 'pending',
            'total' => $this->faker->randomFloat(2, 5, 100),
        ];
    }

    public function pickup(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'pickup',
            'address' => null,
        ]);
    }

    public function delivery(): static
    {
        return $this->state(fn (array $attributes) => ['type' => 'delivery']);
    }
}
