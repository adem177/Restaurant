<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AdminUserApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_staff_endpoints_require_authentication(): void
    {
        $this->getJson('/api/admin/users')->assertUnauthorized();
        $this->postJson('/api/admin/users')->assertUnauthorized();
    }

    public function test_client_role_cannot_manage_staff(): void
    {
        $client = User::factory()->client()->create();

        $response = $this->actingAs($client, 'sanctum')->getJson('/api/admin/users');

        $response->assertForbidden();
    }

    public function test_employee_role_cannot_manage_staff(): void
    {
        $employee = User::factory()->employee()->create();

        $this->actingAs($employee, 'sanctum')->getJson('/api/admin/users')->assertForbidden();
        $this->actingAs($employee, 'sanctum')->postJson('/api/admin/users', [])->assertForbidden();
    }

    public function test_admin_can_list_only_staff_members(): void
    {
        $admin = User::factory()->admin()->create();
        User::factory()->employee()->create();
        User::factory()->count(2)->client()->create();

        $response = $this->actingAs($admin, 'sanctum')->getJson('/api/admin/users');

        $response->assertOk()->assertJsonCount(2, 'data');
    }

    public function test_admin_can_create_employee(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin, 'sanctum')->postJson('/api/admin/users', [
            'name' => 'Sami Trabelsi',
            'email' => 'sami@happyplate.com',
            'phone' => '20111222',
            'password' => 'secret123',
            'password_confirmation' => 'secret123',
            'role' => 'employee',
        ]);

        $response->assertCreated()->assertJsonPath('data.role', 'employee');
        $this->assertDatabaseHas('users', ['email' => 'sami@happyplate.com', 'role' => 'employee']);

        $created = User::where('email', 'sami@happyplate.com')->firstOrFail();
        $this->assertTrue(Hash::check('secret123', $created->password));
    }

    public function test_admin_can_create_another_admin(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin, 'sanctum')->postJson('/api/admin/users', [
            'name' => 'Nour Ben Salah',
            'email' => 'nour@happyplate.com',
            'password' => 'secret123',
            'password_confirmation' => 'secret123',
            'role' => 'admin',
        ]);

        $response->assertCreated()->assertJsonPath('data.role', 'admin');
        $this->assertDatabaseHas('users', ['email' => 'nour@happyplate.com', 'role' => 'admin']);
    }

    public function test_staff_creation_rejects_client_role(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin, 'sanctum')->postJson('/api/admin/users', [
            'name' => 'Intrus',
            'email' => 'intrus@example.com',
            'password' => 'secret123',
            'password_confirmation' => 'secret123',
            'role' => 'client',
        ]);

        $response->assertUnprocessable()->assertJsonValidationErrors('role');
        $this->assertDatabaseMissing('users', ['email' => 'intrus@example.com']);
    }

    public function test_admin_can_update_staff_details(): void
    {
        $admin = User::factory()->admin()->create();
        $employee = User::factory()->employee()->create();

        $response = $this->actingAs($admin, 'sanctum')->putJson("/api/admin/users/{$employee->id}", [
            'name' => 'Sami Modifié',
            'email' => $employee->email,
            'phone' => '55123456',
        ]);

        $response->assertOk()->assertJsonPath('data.name', 'Sami Modifié');
        $this->assertDatabaseHas('users', ['id' => $employee->id, 'phone' => '55123456']);
    }

    public function test_admin_can_promote_employee_to_admin(): void
    {
        $admin = User::factory()->admin()->create();
        $employee = User::factory()->employee()->create();

        $response = $this->actingAs($admin, 'sanctum')->putJson("/api/admin/users/{$employee->id}", [
            'role' => 'admin',
        ]);

        $response->assertOk()->assertJsonPath('data.role', 'admin');
        $this->assertDatabaseHas('users', ['id' => $employee->id, 'role' => 'admin']);
    }

    public function test_admin_can_update_own_password_but_not_own_role(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin, 'sanctum')
            ->putJson("/api/admin/users/{$admin->id}", ['role' => 'employee'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('role');

        $this->assertDatabaseHas('users', ['id' => $admin->id, 'role' => 'admin']);
    }

    public function test_admin_can_deactivate_an_employee(): void
    {
        $admin = User::factory()->admin()->create();
        $employee = User::factory()->employee()->create();

        $response = $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/admin/users/{$employee->id}/status", ['is_active' => false]);

        $response->assertOk()->assertJsonPath('data.is_active', false);
        $this->assertDatabaseHas('users', ['id' => $employee->id, 'is_active' => false]);
    }

    public function test_deactivated_employee_cannot_use_admin_api(): void
    {
        $admin = User::factory()->admin()->create();
        $employee = User::factory()->employee()->create(['is_active' => false]);

        $this->actingAs($employee, 'sanctum')->getJson('/api/admin/orders')->assertForbidden();
    }

    public function test_deactivated_account_cannot_log_in(): void
    {
        User::factory()->admin()->create([
            'email' => 'frozen@happyplate.com',
            'is_active' => false,
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'frozen@happyplate.com',
            'password' => 'password',
        ]);

        $response->assertUnprocessable()->assertJsonValidationErrors('email');
    }

    public function test_deactivating_revokes_existing_tokens(): void
    {
        $admin = User::factory()->admin()->create();
        $employee = User::factory()->employee()->create();
        $employee->createToken('admin-token', ['employee']);

        $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/admin/users/{$employee->id}/status", ['is_active' => false])
            ->assertOk();

        $this->assertSame(0, $employee->tokens()->count());
    }

    public function test_admin_can_reactivate_an_employee(): void
    {
        $admin = User::factory()->admin()->create();
        $employee = User::factory()->employee()->create(['is_active' => false]);

        $response = $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/admin/users/{$employee->id}/status", ['is_active' => true]);

        $response->assertOk()->assertJsonPath('data.is_active', true);
        $this->assertDatabaseHas('users', ['id' => $employee->id, 'is_active' => true]);
    }

    public function test_admin_cannot_deactivate_own_account(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/admin/users/{$admin->id}/status", ['is_active' => false]);

        $response->assertUnprocessable()->assertJsonValidationErrors('is_active');
        $this->assertDatabaseHas('users', ['id' => $admin->id, 'is_active' => true]);
    }

    public function test_admin_can_delete_an_employee(): void
    {
        $admin = User::factory()->admin()->create();
        $employee = User::factory()->employee()->create();

        $response = $this->actingAs($admin, 'sanctum')->deleteJson("/api/admin/users/{$employee->id}");

        $response->assertOk();
        $this->assertDatabaseMissing('users', ['id' => $employee->id]);
    }

    public function test_admin_cannot_delete_own_account(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin, 'sanctum')->deleteJson("/api/admin/users/{$admin->id}");

        $response->assertUnprocessable()->assertJsonValidationErrors('user');
        $this->assertDatabaseHas('users', ['id' => $admin->id]);
    }

    public function test_deactivated_admin_loses_access_to_staff_management(): void
    {
        $frozenAdmin = User::factory()->admin()->create(['is_active' => false]);
        User::factory()->admin()->create();

        $this->actingAs($frozenAdmin, 'sanctum')->getJson('/api/admin/users')->assertForbidden();
    }
}
