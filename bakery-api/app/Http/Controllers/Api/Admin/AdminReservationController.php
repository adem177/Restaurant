<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\ReservationResource;
use App\Models\Reservation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class AdminReservationController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Reservation::query();

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        if ($request->filled('date')) {
            $query->whereDate('date', $request->string('date'));
        }

        return ReservationResource::collection(
            $query->orderByDesc('date')->orderBy('time')->paginate(15)
        );
    }

    public function updateStatus(Request $request, Reservation $reservation): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'in:pending,confirmed,cancelled'],
        ]);

        $reservation->update($validated);

        return (new ReservationResource($reservation))->response();
    }
}
