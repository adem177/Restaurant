<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Http\Resources\ReservationResource;
use App\Models\Reservation;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /** Points needed for one reward step (100 pts = 5 DT at checkout). */
    private const REWARD_STEP = 100;

    /**
     * Register a new client account and return a Sanctum token.
     */
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'phone' => ['required', 'string', 'max:30'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'locale' => ['nullable', 'in:fr,en,ar'],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'],
            'locale' => $validated['locale'] ?? 'fr',
            'password' => $validated['password'],
            'role' => 'client',
        ]);

        $token = $user->createToken('client-token', ['client'])->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => $this->userPayload($user),
        ], 201);
    }

    /**
     * Login and return a Sanctum personal access token.
     */
    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        if (! $user->is_active) {
            throw ValidationException::withMessages([
                'email' => ['This account has been deactivated.'],
            ]);
        }

        $token = $user->createToken('admin-token', [$user->role])->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => $this->userPayload($user),
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json($this->userPayload($request->user()));
    }

    /**
     * Update the authenticated client's own profile.
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'phone' => ['sometimes', 'string', 'max:30'],
            'locale' => ['sometimes', 'in:fr,en,ar'],
            'password' => ['sometimes', 'string', 'min:8', 'confirmed'],
        ]);

        if (array_key_exists('password', $validated)) {
            $user->password = $validated['password'];
            unset($validated['password']);
        }

        $user->fill($validated);
        $user->save();

        return response()->json($this->userPayload($user));
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out.']);
    }

    /**
     * The client's loyalty balance and point history.
     */
    public function loyalty(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'points' => (int) $user->loyalty_points,
            'next_reward_points' => self::REWARD_STEP,
            'transactions' => $user->loyaltyTransactions()
                ->latest('id')
                ->get()
                ->map(fn ($tx) => [
                    'id' => $tx->id,
                    'points' => $tx->points,
                    'type' => $tx->type,
                    'description' => $tx->description,
                    'date' => $tx->created_at->toDateString(),
                ]),
        ]);
    }

    /**
     * The client's own orders, newest first.
     */
    public function orders(Request $request): AnonymousResourceCollection
    {
        return OrderResource::collection(
            $request->user()->orders()->with('items.options')->with('items.product')->latest('id')->get()
        );
    }

    /**
     * The client's own reservations, newest first.
     */
    public function reservations(Request $request): AnonymousResourceCollection
    {
        return ReservationResource::collection(
            $request->user()->reservations()->latest('id')->get()
        );
    }

    /**
     * Allow a client to cancel their own pending/confirmed reservation.
     */
    public function cancelReservation(Request $request, Reservation $reservation): JsonResponse
    {
        if ($reservation->user_id !== $request->user()->id) {
            abort(403, 'This reservation does not belong to you.');
        }

        if (! in_array($reservation->status, ['pending', 'confirmed'], true)) {
            throw ValidationException::withMessages([
                'status' => 'This reservation can no longer be cancelled.',
            ]);
        }

        $reservation->update(['status' => 'cancelled']);

        return (new ReservationResource($reservation->fresh()))->response();
    }

    /**
     * @return array<string, mixed>
     */
    private function userPayload(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'locale' => $user->locale,
            'role' => $user->role,
        ];
    }
}
