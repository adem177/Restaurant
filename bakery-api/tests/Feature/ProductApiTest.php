<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_products_index_returns_paginated_list(): void
    {
        Product::factory()->count(3)->create();

        $response = $this->getJson('/api/products');

        $response->assertOk()
            ->assertJsonCount(3, 'data')
            ->assertJsonStructure([
                'data' => [['id', 'category_id', 'name_fr', 'name_ar', 'price', 'image', 'is_vegetarian', 'is_gluten_free', 'is_featured']],
                'meta' => ['current_page', 'last_page', 'total'],
            ]);
    }

    public function test_products_can_filter_by_category_slug(): void
    {
        $breadCategory = Category::factory()->create(['slug' => 'bread']);
        $cakeCategory = Category::factory()->create(['slug' => 'cake']);
        Product::factory()->count(2)->create(['category_id' => $breadCategory->id]);
        Product::factory()->create(['category_id' => $cakeCategory->id]);

        $response = $this->getJson('/api/products?category=bread');

        $response->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('meta.total', 2);
    }

    public function test_products_can_filter_by_vegetarian(): void
    {
        Product::factory()->count(2)->vegetarian()->create();
        Product::factory()->create(['is_vegetarian' => false]);

        $response = $this->getJson('/api/products?vegetarian=1');

        $response->assertOk()->assertJsonCount(2, 'data');
    }

    public function test_products_can_filter_by_gluten_free(): void
    {
        Product::factory()->glutenFree()->create();
        Product::factory()->count(2)->create(['is_gluten_free' => false]);

        $response = $this->getJson('/api/products?gluten_free=1');

        $response->assertOk()->assertJsonCount(1, 'data');
    }

    public function test_products_can_filter_featured(): void
    {
        Product::factory()->count(3)->featured()->create();
        Product::factory()->create(['is_featured' => false]);

        $response = $this->getJson('/api/products?featured=1');

        $response->assertOk()->assertJsonCount(3, 'data');
    }

    public function test_products_can_search_by_name(): void
    {
        Product::factory()->create(['name_fr' => 'Croissant aux amandes']);
        Product::factory()->create(['name_fr' => 'Pain de seigle']);

        $response = $this->getJson('/api/products?search=Croissant');

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name_fr', 'Croissant aux amandes');
    }

    public function test_product_show_returns_single_product(): void
    {
        $product = Product::factory()->create();

        $response = $this->getJson("/api/products/{$product->id}");

        $response->assertOk()
            ->assertJsonPath('data.id', $product->id)
            ->assertJsonStructure([
                'data' => ['id', 'category_id', 'name_fr', 'name_ar', 'price', 'category' => ['id', 'slug']],
            ]);
    }

    public function test_product_show_returns_404_for_missing_product(): void
    {
        $response = $this->getJson('/api/products/999');

        $response->assertNotFound();
    }

    public function test_product_includes_english_name_and_description(): void
    {
        Product::factory()->create([
            'name_en' => 'Walnut bread',
            'description_en' => 'Freshly baked.',
        ]);

        $response = $this->getJson('/api/products/1');

        $response->assertOk()
            ->assertJsonPath('data.name_en', 'Walnut bread')
            ->assertJsonPath('data.description_en', 'Freshly baked.');
    }

    public function test_product_english_fields_are_null_when_unset(): void
    {
        Product::factory()->create(['name_en' => null, 'description_en' => null]);

        $response = $this->getJson('/api/products');

        $response->assertOk()
            ->assertJsonPath('data.0.name_en', null)
            ->assertJsonPath('data.0.description_en', null);
    }
}
