<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ReservationResource;
use App\Models\Reservation;
use App\Notifications\ReservationConfirmedNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Notification;

class ReservationController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string', 'max:30'],
            'email' => ['required', 'email', 'max:255'],
            'date' => ['required', 'date', 'after_or_equal:today'],
            'time' => ['required', 'date_format:H:i'],
            'guests' => ['required', 'integer', 'min:1', 'max:20'],
        ]);

        // The route requires auth:sanctum, so a client account is mandatory.
        $reservation = Reservation::create([
            ...$validated,
            'user_id' => $request->user()->id,
            'status' => 'pending',
        ]);

        /*
         * Send the confirmation email.
         * With MAIL_MAILER=log (default in dev) the email content is written to
         * storage/logs/laravel.log so it can be inspected without SMTP credentials.
         */
        Notification::route('mail', $reservation->email)
            ->notify(new ReservationConfirmedNotification($reservation));

        return (new ReservationResource($reservation))->response()->setStatusCode(201);
    }

    public function show(Reservation $reservation): JsonResponse
    {
        return (new ReservationResource($reservation))->response();
    }
}
