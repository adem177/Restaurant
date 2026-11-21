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
        $nameFr = ucfirst($this->faker->unique()->word());

        return [
            'name_fr' => $nameFr,
            'name_ar' => $this->faker->unique()->word(),
            'slug' => strtolower($nameFr).'-'.$this->faker->unique()->numberBetween(1, 9999),
        ];
    }
}
