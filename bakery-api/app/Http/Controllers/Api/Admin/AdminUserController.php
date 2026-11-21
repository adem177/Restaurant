<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\StaffResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class AdminUserController extends Controller
{
    /**
     * Every staff account (admin + employee), newest first.
     */
    public function index(): AnonymousResourceCollection
    {
        return StaffResource::collection(
            User::whereIn('role', ['admin', 'employee'])->latest('id')->get()
        );
    }

    /**
     * Create a new employee or admin account.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'phone' => ['nullable', 'string', 'max:30'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'role' => ['required', 'in:admin,employee'],
        ]);

        unset($validated['password_confirmation']);

        $user = User::create([
            ...$validated,
            'locale' => 'fr',
            'is_active' => true,
        ]);

        return (new StaffResource($user))->response()->setStatusCode(201);
    }

    /**
     * Update a staff member's identity, role or password.
     */
    public function update(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'phone' => ['sometimes', 'nullable', 'string', 'max:30'],
            'password' => ['sometimes', 'nullable', 'string', 'min:8', 'confirmed'],
            'role' => ['sometimes', 'in:admin,employee'],
        ]);

        if (array_key_exists('role', $validated) && $validated['role'] !== $user->role) {
            if ($user->is($request->user())) {
                throw ValidationException::withMessages([
                    'role' => 'You cannot change your own role.',
                ]);
            }

            $this->guardLastActiveAdmin($user, 'role');
        }

        $password = $validated['password'] ?? null;
        unset($validated['password'], $validated['password_confirmation']);

        $user->fill($validated);

        if ($password !== null) {
            $user->password = $password;
        }

        $user->save();

        return (new StaffResource($user))->response();
    }

    /**
     * Activate or deactivate a staff account. A deactivated account can no
     * longer log in and its existing sessions are revoked immediately.
     */
    public function updateStatus(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'is_active' => ['required', 'boolean'],
        ]);

        if (! $validated['is_active']) {
            if ($user->is($request->user())) {
                throw ValidationException::withMessages([
                    'is_active' => 'You cannot deactivate your own account.',
                ]);
            }

            $this->guardLastActiveAdmin($user, 'is_active');
        }

        $user->is_active = $validated['is_active'];
        $user->save();

        if (! $user->is_active) {
            $user->tokens()->delete();
        }

        return (new StaffResource($user))->response();
    }

    /**
     * Delete a staff account and revoke its sessions.
     */
    public function destroy(Request $request, User $user): JsonResponse
    {
        if ($user->is($request->user())) {
            throw ValidationException::withMessages([
                'user' => 'You cannot delete your own account.',
            ]);
        }

        $this->guardLastActiveAdmin($user, 'user');

        $user->tokens()->delete();
        $user->delete();

        return response()->json(['message' => 'Staff member deleted.']);
    }

    /**
     * Refuse any change that would leave the back office without a single
     * active admin (demotion, deactivation or deletion of the last one).
     *
     * @throws ValidationException
     */
    private function guardLastActiveAdmin(User $user, string $field): void
    {
        $isLastActiveAdmin = $user->role === 'admin'
            && $user->is_active
            && ! User::where('role', 'admin')
                ->where('is_active', true)
                ->whereKeyNot($user->id)
                ->exists();

        if ($isLastActiveAdmin) {
            throw ValidationException::withMessages([
                $field => 'This is the only active admin account: promote another admin first.',
            ]);
        }
    }
}
