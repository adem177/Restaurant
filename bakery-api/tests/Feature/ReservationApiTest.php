<?php

namespace Tests\Feature;

use App\Models\Reservation;
use App\Models\User;
use App\Notifications\ReservationConfirmedNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class ReservationApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_reservation_requires_authentication(): void
    {
        $response = $this->postJson('/api/reservations', [
            'name' => 'Anonymous',
            'phone' => '0600000000',
            'email' => 'anon@test.com',
            'date' => now()->addDays(2)->format('Y-m-d'),
            'time' => '19:00',
            'guests' => 2,
        ]);

        $response->assertUnauthorized();
    }

    public function test_authenticated_client_can_create_reservation_linked_to_account(): void
    {
        $client = User::factory()->client()->create();

        $response = $this->actingAs($client, 'sanctum')->postJson('/api/reservations', [
            'name' => 'Amina',
            'phone' => '0699887766',
            'email' => 'amina@test.com',
            'date' => now()->addDays(7)->format('Y-m-d'),
            'time' => '19:30',
            'guests' => 4,
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.name', 'Amina')
            ->assertJsonPath('data.guests', 4)
            ->assertJsonPath('data.status', 'pending');

        $this->assertDatabaseHas('reservations', [
            'name' => 'Amina',
            'guests' => 4,
            'user_id' => $client->id,
        ]);
    }

    public function test_reservation_rejects_past_date(): void
    {
        $client = User::factory()->client()->create();

        $response = $this->actingAs($client, 'sanctum')->postJson('/api/reservations', [
            'name' => 'Late',
            'phone' => '0611223344',
            'email' => 'late@test.com',
            'date' => now()->subDays(2)->format('Y-m-d'),
            'time' => '12:00',
            'guests' => 2,
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors('date');
    }

    public function test_reservation_requires_valid_email_and_guests(): void
    {
        $client = User::factory()->client()->create();

        $response = $this->actingAs($client, 'sanctum')->postJson('/api/reservations', [
            'name' => 'Invalid',
            'phone' => '0611223344',
            'email' => 'not-an-email',
            'date' => now()->addDays(3)->format('Y-m-d'),
            'time' => '12:00',
            'guests' => 0,
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['email', 'guests']);
    }

    public function test_reservation_show_returns_single_reservation(): void
    {
        $reservation = Reservation::factory()->create();

        $response = $this->getJson("/api/reservations/{$reservation->id}");

        $response->assertOk()
            ->assertJsonPath('data.id', $reservation->id)
            ->assertJsonStructure([
                'data' => ['id', 'name', 'phone', 'email', 'date', 'time', 'guests', 'status'],
            ]);
    }

    public function test_creating_reservation_sends_confirmation_email(): void
    {
        Notification::fake();
        $client = User::factory()->client()->create();

        $this->actingAs($client, 'sanctum')->postJson('/api/reservations', [
            'name' => 'Email Test',
            'phone' => '0600000000',
            'email' => 'client@test.ma',
            'date' => now()->addDays(5)->format('Y-m-d'),
            'time' => '19:00',
            'guests' => 3,
        ])->assertCreated();

        Notification::assertSentOnDemand(
            ReservationConfirmedNotification::class,
            fn ($notification, $channels, $notifiable) => $notifiable->routeNotificationFor('mail') === 'client@test.ma',
        );
    }
}
