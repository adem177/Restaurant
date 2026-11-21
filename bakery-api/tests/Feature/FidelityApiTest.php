<?php

namespace Tests\Feature;

use App\Models\LoyaltyTransaction;
use App\Models\Order;
use App\Models\Product;
use App\Models\Promo;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FidelityApiTest extends TestCase
{
    use RefreshDatabase;

    private function checkout(User $user, Product $product, array $extra = [])
    {
        return $this->actingAs($user, 'sanctum')->postJson('/api/orders', array_merge([
            'customer_name' => $user->name,
            'customer_phone' => '0600000000',
            'customer_email' => $user->email,
            'type' => 'pickup',
            'items' => [['product_id' => $product->id, 'quantity' => 1]],
        ], $extra));
    }

    /*
    |--------------------------------------------------------------------------
    | Promo codes
    |--------------------------------------------------------------------------
    */

    public function test_valid_percent_promo_applies_discount(): void
    {
        $client = User::factory()->client()->create();
        Promo::factory()->create(['code' => 'TEN', 'type' => 'percent', 'value' => 10, 'min_total' => null]);
        $product = Product::factory()->create(['price' => 100.00]);

        $response = $this->checkout($client, $product, ['promo_code' => 'TEN']);

        $response->assertCreated()
            ->assertJsonPath('data.promo_code', 'TEN')
            ->assertJsonPath('data.discount', '10.00')
            ->assertJsonPath('data.total', '90.00');

        $this->assertSame(1, Promo::where('code', 'TEN')->first()->used_count);
    }

    public function test_promo_code_is_case_insensitive(): void
    {
        $client = User::factory()->client()->create();
        Promo::factory()->create(['code' => 'SAVE', 'type' => 'fixed', 'value' => 5, 'min_total' => null]);
        $product = Product::factory()->create(['price' => 50.00]);

        $this->checkout($client, $product, ['promo_code' => 'save'])
            ->assertCreated()
            ->assertJsonPath('data.discount', '5.00');
    }

    public function test_unknown_promo_rejected(): void
    {
        $client = User::factory()->client()->create();
        $product = Product::factory()->create(['price' => 50.00]);

        $this->checkout($client, $product, ['promo_code' => 'NOPE'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('promo_code');
    }

    public function test_inactive_promo_rejected(): void
    {
        $client = User::factory()->client()->create();
        Promo::factory()->inactive()->create(['code' => 'OFF']);
        $product = Product::factory()->create(['price' => 50.00]);

        $this->checkout($client, $product, ['promo_code' => 'OFF'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('promo_code');
    }

    public function test_promo_min_total_enforced(): void
    {
        $client = User::factory()->client()->create();
        Promo::factory()->create(['code' => 'MIN', 'type' => 'percent', 'value' => 10, 'min_total' => 100]);
        $product = Product::factory()->create(['price' => 50.00]);

        $this->checkout($client, $product, ['promo_code' => 'MIN'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('promo_code');
    }

    public function test_expired_promo_rejected(): void
    {
        $client = User::factory()->client()->create();
        Promo::factory()->create([
            'code' => 'OLD',
            'type' => 'percent',
            'value' => 10,
            'expires_at' => now()->subDay(),
        ]);
        $product = Product::factory()->create(['price' => 50.00]);

        $this->checkout($client, $product, ['promo_code' => 'OLD'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('promo_code');
    }

    /*
    |--------------------------------------------------------------------------
    | Loyalty points — redemption
    |--------------------------------------------------------------------------
    */

    public function test_points_can_be_redeemed_at_checkout(): void
    {
        $client = User::factory()->client()->create(['loyalty_points' => 100]);
        $product = Product::factory()->create(['price' => 30.00]);

        $response = $this->checkout($client, $product, ['redeem_points' => 100]);

        $response->assertCreated()
            ->assertJsonPath('data.points_redeemed', 100)
            ->assertJsonPath('data.discount', '5.00')
            ->assertJsonPath('data.total', '25.00');

        $this->assertSame(0, $client->fresh()->loyalty_points);
        $this->assertDatabaseHas('loyalty_transactions', [
            'user_id' => $client->id,
            'points' => -100,
            'type' => 'redeemed',
        ]);
    }

    public function test_points_redemption_requires_authentication(): void
    {
        $product = Product::factory()->create(['price' => 30.00]);

        $this->postJson('/api/orders', [
            'customer_name' => 'Guest',
            'customer_phone' => '0600000000',
            'type' => 'pickup',
            'items' => [['product_id' => $product->id, 'quantity' => 1]],
            'redeem_points' => 100,
        ])->assertUnprocessable()->assertJsonValidationErrors('redeem_points');
    }

    public function test_points_redemption_requires_sufficient_balance(): void
    {
        $client = User::factory()->client()->create(['loyalty_points' => 50]);
        $product = Product::factory()->create(['price' => 30.00]);

        $this->checkout($client, $product, ['redeem_points' => 100])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('redeem_points');
    }

    public function test_points_must_be_redeemed_in_blocks_of_100(): void
    {
        $client = User::factory()->client()->create(['loyalty_points' => 150]);
        $product = Product::factory()->create(['price' => 30.00]);

        $this->checkout($client, $product, ['redeem_points' => 50])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('redeem_points');
    }

    public function test_points_redemption_is_capped_at_20_percent(): void
    {
        $client = User::factory()->client()->create(['loyalty_points' => 500]);
        // subtotal 20 => cap 4 DT, but 100 pts = 5 DT > cap.
        $product = Product::factory()->create(['price' => 20.00]);

        $this->checkout($client, $product, ['redeem_points' => 100])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('redeem_points');
    }

    public function test_promo_and_points_cannot_be_combined(): void
    {
        $client = User::factory()->client()->create(['loyalty_points' => 100]);
        Promo::factory()->create(['code' => 'X', 'type' => 'percent', 'value' => 10, 'min_total' => null]);
        $product = Product::factory()->create(['price' => 50.00]);

        $this->checkout($client, $product, ['promo_code' => 'X', 'redeem_points' => 100])
            ->assertUnprocessable();
    }

    /*
    |--------------------------------------------------------------------------
    | Loyalty points — earning
    |--------------------------------------------------------------------------
    */

    public function test_completed_order_credits_points(): void
    {
        $admin = User::factory()->admin()->create();
        $client = User::factory()->client()->create(['loyalty_points' => 0]);
        $order = Order::factory()->create(['user_id' => $client->id, 'total' => 42.00, 'status' => 'confirmed']);

        $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/admin/orders/{$order->id}/status", ['status' => 'completed'])
            ->assertOk();

        $this->assertSame(42, $client->fresh()->loyalty_points);
        $this->assertDatabaseHas('orders', ['id' => $order->id, 'points_earned' => 42]);
        $this->assertDatabaseHas('loyalty_transactions', [
            'user_id' => $client->id,
            'points' => 42,
            'type' => 'earned',
        ]);
    }

    public function test_points_are_credited_only_once(): void
    {
        $admin = User::factory()->admin()->create();
        $client = User::factory()->client()->create(['loyalty_points' => 0]);
        $order = Order::factory()->create(['user_id' => $client->id, 'total' => 42.00, 'status' => 'pending']);

        // pending -> completed (credits)
        $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/admin/orders/{$order->id}/status", ['status' => 'completed'])->assertOk();
        // completed -> ready -> completed (must not credit again)
        $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/admin/orders/{$order->id}/status", ['status' => 'ready'])->assertOk();
        $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/admin/orders/{$order->id}/status", ['status' => 'completed'])->assertOk();

        $this->assertSame(42, $client->fresh()->loyalty_points);
    }

    public function test_guest_completed_order_earns_no_points(): void
    {
        $admin = User::factory()->admin()->create();
        $order = Order::factory()->create(['user_id' => null, 'total' => 42.00, 'status' => 'pending']);

        $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/admin/orders/{$order->id}/status", ['status' => 'completed'])
            ->assertOk();

        $this->assertSame(0, $order->fresh()->points_earned);
    }

    /*
    |--------------------------------------------------------------------------
    | Loyalty endpoint & admin promo CRUD
    |--------------------------------------------------------------------------
    */

    public function test_loyalty_endpoint_returns_balance_and_history(): void
    {
        $client = User::factory()->client()->create(['loyalty_points' => 250]);
        LoyaltyTransaction::create([
            'user_id' => $client->id,
            'points' => 250,
            'type' => 'earned',
            'description' => 'Earned for order #1',
        ]);

        $response = $this->actingAs($client, 'sanctum')->getJson('/api/auth/loyalty');

        $response->assertOk()
            ->assertJsonPath('points', 250)
            ->assertJsonPath('next_reward_points', 100)
            ->assertJsonCount(1, 'transactions');
    }

    public function test_admin_can_manage_promos(): void
    {
        $admin = User::factory()->admin()->create();

        $created = $this->actingAs($admin, 'sanctum')->postJson('/api/admin/promos', [
            'code' => 'WELCOME',
            'type' => 'percent',
            'value' => 15,
            'min_total' => 25,
        ]);
        $created->assertCreated()->assertJsonPath('data.code', 'WELCOME');

        $id = $created->json('data.id');

        $this->actingAs($admin, 'sanctum')->putJson("/api/admin/promos/{$id}", [
            'code' => 'WELCOME',
            'type' => 'percent',
            'value' => 20,
        ])->assertOk()->assertJsonPath('data.value', '20.00');

        $this->actingAs($admin, 'sanctum')->deleteJson("/api/admin/promos/{$id}")->assertOk();
        $this->assertDatabaseMissing('promos', ['id' => $id]);
    }

    public function test_promo_store_rejects_duplicate_code(): void
    {
        $admin = User::factory()->admin()->create();
        Promo::factory()->create(['code' => 'DUP']);

        $this->actingAs($admin, 'sanctum')->postJson('/api/admin/promos', [
            'code' => 'DUP',
            'type' => 'percent',
            'value' => 10,
        ])->assertUnprocessable()->assertJsonValidationErrors('code');
    }

    public function test_promo_crud_requires_staff(): void
    {
        $client = User::factory()->client()->create();

        $this->actingAs($client, 'sanctum')
            ->getJson('/api/admin/promos')
            ->assertForbidden();
    }
}
