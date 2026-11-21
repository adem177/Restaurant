<?php

namespace Database\Factories;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Product>
 */
class ProductFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'category_id' => Category::factory(),
            'name_fr' => $this->faker->unique()->words(3, true),
            'name_ar' => $this->faker->unique()->words(3, true),
            'description_fr' => $this->faker->sentence(),
            'description_ar' => $this->faker->sentence(),
            'price' => $this->faker->randomFloat(2, 2, 30),
            'image' => $this->faker->word().'.jpg',
            'is_vegetarian' => false,
            'is_gluten_free' => false,
            'is_featured' => false,
        ];
    }

    public function vegetarian(): static
    {
        return $this->state(fn (array $attributes) => ['is_vegetarian' => true]);
    }

    public function glutenFree(): static
    {
        return $this->state(fn (array $attributes) => ['is_gluten_free' => true]);
    }

    public function featured(): static
    {
        return $this->state(fn (array $attributes) => ['is_featured' => true]);
    }

    /**
     * Unlimited stock (the default: NULL is never sold out).
     */
    public function unlimitedStock(): static
    {
        return $this->state(fn (array $attributes) => ['stock' => null]);
    }

    public function lowStock(): static
    {
        return $this->state(fn (array $attributes) => ['stock' => 3]);
    }

    public function outOfStock(): static
    {
        return $this->state(fn (array $attributes) => ['stock' => 0]);
    }

    public function withStock(int $quantity): static
    {
        return $this->state(fn (array $attributes) => ['stock' => $quantity]);
    }
}
