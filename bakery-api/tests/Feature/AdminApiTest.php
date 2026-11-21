<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Order;
use App\Models\Product;
use App\Models\Reservation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_endpoints_require_authentication(): void
    {
        $this->getJson('/api/admin/stats')->assertUnauthorized();
        $this->getJson('/api/admin/products')->assertUnauthorized();
        $this->getJson('/api/admin/orders')->assertUnauthorized();
        $this->getJson('/api/admin/reservations')->assertUnauthorized();
    }

    public function test_client_role_cannot_access_admin_endpoints(): void
    {
        $client = User::factory()->client()->create();

        $response = $this->actingAs($client, 'sanctum')->getJson('/api/admin/stats');

        $response->assertForbidden();
    }

    public function test_admin_can_create_product(): void
    {
        $admin = User::factory()->admin()->create();
        $category = Category::factory()->create();

        $response = $this->actingAs($admin, 'sanctum')->postJson('/api/admin/products', [
            'category_id' => $category->id,
            'name_fr' => 'Pain frais',
            'name_ar' => 'خبز طازج',
            'price' => 3.50,
            'is_vegetarian' => true,
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.name_fr', 'Pain frais')
            ->assertJsonPath('data.price', '3.50');

        $this->assertDatabaseHas('products', ['name_fr' => 'Pain frais']);
    }

    public function test_admin_can_update_product(): void
    {
        $admin = User::factory()->admin()->create();
        $product = Product::factory()->create();
        $category = Category::factory()->create();

        $response = $this->actingAs($admin, 'sanctum')->putJson("/api/admin/products/{$product->id}", [
            'category_id' => $category->id,
            'name_fr' => 'Pain modifié',
            'name_ar' => 'خبز محدث',
            'price' => 4.00,
        ]);

        $response->assertOk()->assertJsonPath('data.name_fr', 'Pain modifié');
        $this->assertDatabaseHas('products', ['id' => $product->id, 'name_fr' => 'Pain modifié']);
    }

    public function test_admin_can_create_product_with_english_name(): void
    {
        $admin = User::factory()->admin()->create();
        $category = Category::factory()->create();

        $response = $this->actingAs($admin, 'sanctum')->postJson('/api/admin/products', [
            'category_id' => $category->id,
            'name_fr' => 'Pain frais',
            'name_ar' => 'خبز طازج',
            'name_en' => 'Fresh bread',
            'description_en' => 'Baked every morning.',
            'price' => 3.50,
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.name_en', 'Fresh bread')
            ->assertJsonPath('data.description_en', 'Baked every morning.');

        $this->assertDatabaseHas('products', ['name_fr' => 'Pain frais', 'name_en' => 'Fresh bread']);
    }

    public function test_admin_can_update_product_english_name(): void
    {
        $admin = User::factory()->admin()->create();
        $product = Product::factory()->create(['name_en' => null]);
        $category = Category::factory()->create();

        $response = $this->actingAs($admin, 'sanctum')->putJson("/api/admin/products/{$product->id}", [
            'category_id' => $category->id,
            'name_fr' => 'Pain frais',
            'name_ar' => 'خبز طازج',
            'name_en' => 'Fresh bread',
            'price' => 3.50,
        ]);

        $response->assertOk()->assertJsonPath('data.name_en', 'Fresh bread');
        $this->assertDatabaseHas('products', ['id' => $product->id, 'name_en' => 'Fresh bread']);
    }

    public function test_admin_can_create_product_without_english_name(): void
    {
        $admin = User::factory()->admin()->create();
        $category = Category::factory()->create();

        $response = $this->actingAs($admin, 'sanctum')->postJson('/api/admin/products', [
            'category_id' => $category->id,
            'name_fr' => 'Pain frais',
            'name_ar' => 'خبز طازج',
            'price' => 3.50,
        ]);

        // name_en is optional: the frontend falls back to French.
        $response->assertCreated()->assertJsonPath('data.name_en', null);
    }

    public function test_admin_can_delete_product(): void
    {
        $admin = User::factory()->admin()->create();
        $product = Product::factory()->create();

        $response = $this->actingAs($admin, 'sanctum')->deleteJson("/api/admin/products/{$product->id}");

        $response->assertOk();
        $this->assertDatabaseMissing('products', ['id' => $product->id]);
    }

    public function test_admin_can_update_order_status(): void
    {
        $admin = User::factory()->admin()->create();
        $order = Order::factory()->create(['status' => 'pending']);

        $response = $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/admin/orders/{$order->id}/status", ['status' => 'confirmed']);

        $response->assertOk()->assertJsonPath('data.status', 'confirmed');
    }

    public function test_order_status_rejects_invalid_value(): void
    {
        $admin = User::factory()->admin()->create();
        $order = Order::factory()->create();

        $response = $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/admin/orders/{$order->id}/status", ['status' => 'invalid']);

        $response->assertUnprocessable()->assertJsonValidationErrors('status');
    }

    public function test_admin_can_update_reservation_status(): void
    {
        $admin = User::factory()->admin()->create();
        $reservation = Reservation::factory()->create(['status' => 'pending']);

        $response = $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/admin/reservations/{$reservation->id}/status", ['status' => 'confirmed']);

        $response->assertOk()->assertJsonPath('data.status', 'confirmed');
    }

    public function test_employee_can_list_orders(): void
    {
        $employee = User::factory()->employee()->create();
        Order::factory()->count(3)->create();

        $response = $this->actingAs($employee, 'sanctum')->getJson('/api/admin/orders');

        $response->assertOk()->assertJsonCount(3, 'data');
    }

    public function test_stats_returns_overview_and_charts(): void
    {
        $admin = User::factory()->admin()->create();
        Order::factory()->count(2)->create(['status' => 'completed']);
        Reservation::factory()->create(['status' => 'confirmed']);

        $response = $this->actingAs($admin, 'sanctum')->getJson('/api/admin/stats');

        $response->assertOk()->assertJsonStructure([
            'overview' => ['today_revenue', 'today_orders', 'pending_orders', 'today_reservations', 'upcoming_reservations'],
            'top_products',
            'peak_hours',
            'daily_revenue',
        ]);
    }
}
