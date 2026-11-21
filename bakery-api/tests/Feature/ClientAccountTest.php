<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Product;
use App\Models\Reservation;
use App\Models\User;
use App\Notifications\OrderStatusNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class ClientAccountTest extends TestCase
{
    use RefreshDatabase;

    public function test_orders_endpoint_requires_authentication(): void
    {
        $this->getJson('/api/auth/orders')->assertUnauthorized();
    }

    public function test_client_sees_only_their_own_orders(): void
    {
        $client = User::factory()->client()->create();
        $other = User::factory()->client()->create();

        $mine = Order::factory()->create(['user_id' => $client->id]);
        Order::factory()->create(['user_id' => $other->id]);

        $response = $this->actingAs($client, 'sanctum')->getJson('/api/auth/orders');

        $response->assertOk()->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $mine->id);
    }

    public function test_client_sees_only_their_own_reservations(): void
    {
        $client = User::factory()->client()->create();
        $other = User::factory()->client()->create();

        $mine = Reservation::factory()->create(['user_id' => $client->id]);
        Reservation::factory()->create(['user_id' => $other->id]);

        $response = $this->actingAs($client, 'sanctum')->getJson('/api/auth/reservations');

        $response->assertOk()->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $mine->id);
    }

    public function test_authenticated_checkout_links_order_to_account(): void
    {
        $client = User::factory()->client()->create();
        $product = Product::factory()->create(['price' => 5.00]);

        $response = $this->actingAs($client, 'sanctum')->postJson('/api/orders', [
            'customer_name' => $client->name,
            'customer_phone' => '0600000000',
            'customer_email' => $client->email,
            'type' => 'pickup',
            'items' => [['product_id' => $product->id, 'quantity' => 2]],
        ]);

        $response->assertCreated();
        $this->assertDatabaseHas('orders', [
            'id' => $response->json('data.id'),
            'user_id' => $client->id,
        ]);
    }

    public function test_guest_checkout_creates_order_without_account(): void
    {
        $product = Product::factory()->create(['price' => 5.00]);

        $response = $this->postJson('/api/orders', [
            'customer_name' => 'Invité',
            'customer_phone' => '0600000000',
            'type' => 'pickup',
            'items' => [['product_id' => $product->id, 'quantity' => 1]],
        ]);

        $response->assertCreated();
        $this->assertDatabaseHas('orders', [
            'id' => $response->json('data.id'),
            'user_id' => null,
        ]);
    }

    public function test_client_can_update_profile(): void
    {
        $client = User::factory()->client()->create();

        $response = $this->actingAs($client, 'sanctum')->patchJson('/api/auth/profile', [
            'name' => 'Nouveau Nom',
            'phone' => '0711223344',
            'locale' => 'en',
        ]);

        $response->assertOk()
            ->assertJsonPath('name', 'Nouveau Nom')
            ->assertJsonPath('locale', 'en');

        $this->assertDatabaseHas('users', [
            'id' => $client->id,
            'name' => 'Nouveau Nom',
            'locale' => 'en',
        ]);
    }

    public function test_client_can_change_password(): void
    {
        $client = User::factory()->client()->create(['password' => 'oldpassword']);

        $this->actingAs($client, 'sanctum')->patchJson('/api/auth/profile', [
            'password' => 'newpassword123',
            'password_confirmation' => 'newpassword123',
        ])->assertOk();

        $client->refresh();
        $this->assertTrue(Hash::check('newpassword123', $client->password));
    }

    public function test_profile_rejects_invalid_locale(): void
    {
        $client = User::factory()->client()->create();

        $this->actingAs($client, 'sanctum')->patchJson('/api/auth/profile', [
            'locale' => 'de',
        ])->assertUnprocessable()->assertJsonValidationErrors('locale');
    }

    public function test_client_can_cancel_own_reservation(): void
    {
        $client = User::factory()->client()->create();
        $reservation = Reservation::factory()->create([
            'user_id' => $client->id,
            'status' => 'pending',
        ]);

        $response = $this->actingAs($client, 'sanctum')
            ->patchJson("/api/auth/reservations/{$reservation->id}/cancel");

        $response->assertOk()->assertJsonPath('data.status', 'cancelled');
        $this->assertDatabaseHas('reservations', [
            'id' => $reservation->id,
            'status' => 'cancelled',
        ]);
    }

    public function test_client_cannot_cancel_another_clients_reservation(): void
    {
        $client = User::factory()->client()->create();
        $other = User::factory()->client()->create();
        $reservation = Reservation::factory()->create(['user_id' => $other->id]);

        $this->actingAs($client, 'sanctum')
            ->patchJson("/api/auth/reservations/{$reservation->id}/cancel")
            ->assertForbidden();
    }

    public function test_client_cannot_cancel_already_cancelled_reservation(): void
    {
        $client = User::factory()->client()->create();
        $reservation = Reservation::factory()->create([
            'user_id' => $client->id,
            'status' => 'cancelled',
        ]);

        $this->actingAs($client, 'sanctum')
            ->patchJson("/api/auth/reservations/{$reservation->id}/cancel")
            ->assertUnprocessable()
            ->assertJsonValidationErrors('status');
    }

    public function test_cancel_endpoint_requires_authentication(): void
    {
        $reservation = Reservation::factory()->create();

        $this->patchJson("/api/auth/reservations/{$reservation->id}/cancel")
            ->assertUnauthorized();
    }

    public function test_status_change_notifies_linked_account_in_account_locale(): void
    {
        Notification::fake();
        $admin = User::factory()->admin()->create();
        $client = User::factory()->client()->create(['locale' => 'en']);
        $order = Order::factory()->create(['user_id' => $client->id, 'status' => 'pending']);

        $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/admin/orders/{$order->id}/status", ['status' => 'confirmed'])
            ->assertOk();

        Notification::assertSentTo($client, OrderStatusNotification::class);
    }

    public function test_status_change_notifies_guest_order_email(): void
    {
        Notification::fake();
        $admin = User::factory()->admin()->create();
        $order = Order::factory()->create([
            'user_id' => null,
            'customer_email' => 'guest@test.ma',
            'status' => 'pending',
        ]);

        $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/admin/orders/{$order->id}/status", ['status' => 'ready'])
            ->assertOk();

        Notification::assertSentOnDemand(OrderStatusNotification::class);
    }

    public function test_setting_same_status_sends_no_notification(): void
    {
        Notification::fake();
        $admin = User::factory()->admin()->create();
        $client = User::factory()->client()->create();
        $order = Order::factory()->create(['user_id' => $client->id, 'status' => 'confirmed']);

        $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/admin/orders/{$order->id}/status", ['status' => 'confirmed'])
            ->assertOk();

        Notification::assertNotSentTo($client, OrderStatusNotification::class);
    }

    public function test_register_accepts_locale(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name' => 'Locale Test',
            'email' => 'locale@test.ma',
            'phone' => '0611223344',
            'password' => 'secret123',
            'password_confirmation' => 'secret123',
            'locale' => 'ar',
        ]);

        $response->assertCreated()->assertJsonPath('user.locale', 'ar');
        $this->assertDatabaseHas('users', ['email' => 'locale@test.ma', 'locale' => 'ar']);
    }
}
