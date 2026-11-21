<?php

namespace Database\Factories;

use App\Models\Allergen;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Allergen>
 */
class AllergenFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'code' => $this->faker->unique()->slug(2),
            'name_fr' => $this->faker->unique()->word(),
            'name_en' => $this->faker->unique()->word(),
            'name_ar' => $this->faker->unique()->word(),
        ];
    }
}
