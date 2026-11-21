<?php

namespace Tests\Feature;

use App\Models\Allergen;
use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Database\Seeders\AllergenSeeder;
use Database\Seeders\ProductNutritionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AllergenApiTest extends TestCase
{
    use RefreshDatabase;

    private function seedAllergens(): void
    {
        $this->seed(AllergenSeeder::class);
    }

    public function test_allergen_reference_list_is_public_and_translated(): void
    {
        $this->seedAllergens();

        $response = $this->getJson('/api/allergens')->assertOk()->json('data');

        $this->assertCount(14, $response);
        $gluten = collect($response)->firstWhere('code', 'gluten');

        $this->assertSame('Gluten', $gluten['name_fr']);
        $this->assertSame('Gluten', $gluten['name_en']);
        $this->assertNotEmpty($gluten['name_ar']);
    }

    public function test_product_resource_exposes_allergens_and_nutrition(): void
    {
        $this->seedAllergens();
        $product = Product::factory()->create([
            'calories' => 250,
            'carbs_g' => 40.0,
            'fat_g' => 9.0,
            'protein_g' => 6.5,
        ]);
        $product->allergens()->sync(
            Allergen::whereIn('code', ['gluten', 'milk'])->pluck('id')
        );

        $data = $this->getJson("/api/products/{$product->id}")->assertOk()->json('data');

        $this->assertSame(250, $data['calories']);
        $this->assertSame('40.0', $data['carbs_g']);
        $this->assertEqualsCanonicalizing(['gluten', 'milk'], collect($data['allergens'])->pluck('code')->all());
    }

    public function test_nutrition_is_null_when_not_published(): void
    {
        $product = Product::factory()->create(['calories' => null, 'carbs_g' => null]);

        $data = $this->getJson("/api/products/{$product->id}")->assertOk()->json('data');

        $this->assertNull($data['calories']);
        $this->assertNull($data['carbs_g']);
        $this->assertNull($data['protein_g']);
        $this->assertSame([], $data['allergens']);
    }

    public function test_exclude_allergen_hides_products_containing_it(): void
    {
        $this->seedAllergens();
        $bread = Product::factory()->create(['name_fr' => 'Pain']);
        $bread->allergens()->sync(Allergen::where('code', 'gluten')->pluck('id'));
        Product::factory()->create(['name_fr' => 'Tartelette sans gluten']);

        $names = collect($this->getJson('/api/products?exclude_allergen=gluten')->assertOk()->json('data'))
            ->pluck('name_fr')
            ->all();

        $this->assertSame(['Tartelette sans gluten'], $names);
    }

    public function test_exclude_allergen_accepts_several_codes(): void
    {
        $this->seedAllergens();
        Product::factory()->create(['name_fr' => 'Pain'])->allergens()->sync(
            Allergen::where('code', 'gluten')->pluck('id')
        );
        Product::factory()->create(['name_fr' => 'Cheesecake'])->allergens()->sync(
            Allergen::whereIn('code', ['gluten', 'milk'])->pluck('id')
        );
        Product::factory()->create(['name_fr' => 'Expresso']);

        $names = collect($this->getJson('/api/products?exclude_allergen=gluten,milk')->assertOk()->json('data'))
            ->pluck('name_fr')
            ->all();

        $this->assertSame(['Expresso'], $names);
    }

    public function test_exclude_allergen_with_no_matches_returns_everything(): void
    {
        $this->seedAllergens();
        Product::factory()->count(2)->create();

        $this->getJson('/api/products?exclude_allergen=')->assertOk()->assertJsonCount(2, 'data');
        $this->getJson('/api/products?exclude_allergen=unknown')->assertOk()->assertJsonCount(2, 'data');
    }

    /*
    |--------------------------------------------------------------------------
    | Admin
    |--------------------------------------------------------------------------
    */

    public function test_admin_can_attach_and_replace_allergens(): void
    {
        $this->seedAllergens();
        $admin = User::factory()->admin()->create();
        $product = Product::factory()->create();
        $product->allergens()->sync(Allergen::where('code', 'gluten')->pluck('id'));

        $response = $this->actingAs($admin, 'sanctum')->putJson("/api/admin/products/{$product->id}", [
            'category_id' => $product->category_id,
            'name_fr' => $product->name_fr,
            'name_ar' => $product->name_ar,
            'price' => 10.00,
            'allergen_codes' => ['milk', 'eggs'],
        ]);

        $response->assertOk();
        $this->assertEqualsCanonicalizing(
            ['milk', 'eggs'],
            collect($response->json('data.allergens'))->pluck('code')->all(),
        );
    }

    public function test_omitting_allergen_codes_leaves_the_current_set_untouched(): void
    {
        $this->seedAllergens();
        $admin = User::factory()->admin()->create();
        $product = Product::factory()->create();
        $product->allergens()->sync(Allergen::where('code', 'gluten')->pluck('id'));

        $this->actingAs($admin, 'sanctum')->putJson("/api/admin/products/{$product->id}", [
            'category_id' => $product->category_id,
            'name_fr' => $product->name_fr,
            'name_ar' => $product->name_ar,
            'price' => 10.00,
        ])->assertOk();

        $this->assertEquals(['gluten'], $product->fresh()->allergens->pluck('code')->all());
    }

    public function test_unknown_allergen_code_is_rejected(): void
    {
        $this->seedAllergens();
        $admin = User::factory()->admin()->create();
        $product = Product::factory()->create();

        $this->actingAs($admin, 'sanctum')->putJson("/api/admin/products/{$product->id}", [
            'category_id' => $product->category_id,
            'name_fr' => $product->name_fr,
            'name_ar' => $product->name_ar,
            'price' => 10.00,
            'allergen_codes' => ['not-a-real-allergen'],
        ])->assertUnprocessable()->assertJsonValidationErrors('allergen_codes.0');
    }

    public function test_admin_can_save_nutrition_values(): void
    {
        $admin = User::factory()->admin()->create();
        $product = Product::factory()->create();

        $this->actingAs($admin, 'sanctum')->putJson("/api/admin/products/{$product->id}", [
            'category_id' => $product->category_id,
            'name_fr' => $product->name_fr,
            'name_ar' => $product->name_ar,
            'price' => 10.00,
            'calories' => 320,
            'carbs_g' => 45.5,
            'fat_g' => 12.0,
            'protein_g' => 7.5,
        ])
            ->assertOk()
            ->assertJsonPath('data.calories', 320)
            ->assertJsonPath('data.carbs_g', '45.5')
            ->assertJsonPath('data.fat_g', '12.0')
            ->assertJsonPath('data.protein_g', '7.5');
    }

    public function test_negative_nutrition_is_rejected(): void
    {
        $admin = User::factory()->admin()->create();
        $product = Product::factory()->create();

        $this->actingAs($admin, 'sanctum')->putJson("/api/admin/products/{$product->id}", [
            'category_id' => $product->category_id,
            'name_fr' => $product->name_fr,
            'name_ar' => $product->name_ar,
            'price' => 10.00,
            'calories' => -5,
        ])->assertUnprocessable()->assertJsonValidationErrors('calories');
    }

    /*
    |--------------------------------------------------------------------------
    | Seeding
    |--------------------------------------------------------------------------
    */

    public function test_nutrition_seeder_is_idempotent(): void
    {
        $this->seedAllergens();

        $category = Category::factory()->create(['slug' => 'starters']);
        Product::factory()->create(['category_id' => $category->id, 'name_fr' => 'Bruschetta tomates']);

        $this->seed(ProductNutritionSeeder::class);
        $this->seed(ProductNutritionSeeder::class);

        $starter = Product::where('name_fr', 'Bruschetta tomates')->first();

        $this->assertNotNull($starter);
        $this->assertSame(['gluten'], $starter->allergens->pluck('code')->all());
        $this->assertSame(210, $starter->calories);
    }
}
