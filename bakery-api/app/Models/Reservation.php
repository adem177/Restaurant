<?php

namespace App\Models;

use Database\Factories\ReservationFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Reservation extends Model
{
    /** @use HasFactory<ReservationFactory> */
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'phone',
        'email',
        'date',
        'time',
        'guests',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'guests' => 'integer',
        ];
    }
}
