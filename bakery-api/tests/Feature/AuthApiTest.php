<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_returns_token_for_valid_credentials(): void
    {
        $user = User::factory()->admin()->create([
            'email' => 'admin@test.ma',
            'password' => 'secret123',
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'admin@test.ma',
            'password' => 'secret123',
        ]);

        $response->assertOk()
            ->assertJsonStructure(['token', 'user' => ['id', 'name', 'email', 'role']])
            ->assertJsonPath('user.role', 'admin');
    }

    public function test_login_rejects_invalid_credentials(): void
    {
        User::factory()->admin()->create([
            'email' => 'admin@test.ma',
            'password' => 'secret123',
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'admin@test.ma',
            'password' => 'wrong-password',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors('email');
    }

    public function test_me_returns_authenticated_user(): void
    {
        $user = User::factory()->employee()->create();

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/admin/me');

        $response->assertOk()
            ->assertJsonPath('id', $user->id)
            ->assertJsonPath('role', 'employee');
    }

    public function test_logout_deletes_current_token(): void
    {
        $user = User::factory()->admin()->create();
        $token = $user->createToken('t')->plainTextToken;

        $response = $this->withToken($token)->postJson('/api/admin/logout');

        $response->assertOk();
        $this->assertSame(0, $user->tokens()->count());
    }

    public function test_client_can_register_and_get_token(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name' => 'Nouveau Client',
            'email' => 'nouveau@test.ma',
            'phone' => '0612345678',
            'password' => 'secret123',
            'password_confirmation' => 'secret123',
        ]);

        $response->assertCreated()
            ->assertJsonStructure(['token', 'user' => ['id', 'name', 'email', 'phone', 'role']])
            ->assertJsonPath('user.role', 'client');

        $this->assertDatabaseHas('users', [
            'email' => 'nouveau@test.ma',
            'role' => 'client',
        ]);
    }

    public function test_register_rejects_duplicate_email(): void
    {
        User::factory()->client()->create(['email' => 'existe@test.ma']);

        $response = $this->postJson('/api/auth/register', [
            'name' => 'Doublon',
            'email' => 'existe@test.ma',
            'phone' => '0612345678',
            'password' => 'secret123',
            'password_confirmation' => 'secret123',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors('email');
    }

    public function test_register_requires_matching_passwords(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name' => 'Test',
            'email' => 'test@test.ma',
            'phone' => '0612345678',
            'password' => 'secret123',
            'password_confirmation' => 'different',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors('password');
    }

    public function test_generic_me_returns_any_authenticated_user(): void
    {
        $client = User::factory()->client()->create();

        $response = $this->actingAs($client, 'sanctum')->getJson('/api/auth/me');

        $response->assertOk()
            ->assertJsonPath('id', $client->id)
            ->assertJsonPath('role', 'client');
    }
}
