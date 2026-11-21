<?php

namespace Database\Factories;

use App\Models\Reservation;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Reservation>
 */
class ReservationFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => $this->faker->name(),
            'phone' => $this->faker->phoneNumber(),
            'email' => $this->faker->safeEmail(),
            'date' => $this->faker->dateTimeBetween('+1 day', '+30 days')->format('Y-m-d'),
            'time' => $this->faker->randomElement(['12:00', '13:00', '18:30', '19:30', '20:00']),
            'guests' => $this->faker->numberBetween(1, 8),
            'status' => 'pending',
        ];
    }
}
