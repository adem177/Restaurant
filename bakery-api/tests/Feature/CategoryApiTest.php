<?php

namespace Tests\Feature;

use App\Models\Category;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CategoryApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_categories_index_returns_paginated_list(): void
    {
        Category::factory()->count(3)->create();

        $response = $this->getJson('/api/categories');

        $response->assertOk()
            ->assertJsonCount(3, 'data')
            ->assertJsonStructure([
                'data' => [['id', 'name_fr', 'name_ar', 'slug']],
            ]);
    }

    public function test_categories_index_returns_french_and_arabic_names(): void
    {
        Category::create([
            'name_fr' => 'Pains',
            'name_ar' => 'خبز',
            'slug' => 'bread',
        ]);

        $response = $this->getJson('/api/categories');

        $response->assertOk()
            ->assertJsonPath('data.0.name_fr', 'Pains')
            ->assertJsonPath('data.0.name_ar', 'خبز')
            ->assertJsonPath('data.0.slug', 'bread');
    }

    public function test_categories_include_english_name(): void
    {
        Category::create([
            'name_fr' => 'Pains',
            'name_ar' => 'خبز',
            'name_en' => 'Breads',
            'slug' => 'bread',
        ]);

        $response = $this->getJson('/api/categories');

        $response->assertOk()
            ->assertJsonPath('data.0.name_en', 'Breads');
    }
}
