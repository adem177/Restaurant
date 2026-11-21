<?php

namespace App\Models;

use Database\Factories\OrderFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    /** @use HasFactory<OrderFactory> */
    use HasFactory;

    protected $fillable = [
        'user_id',
        'customer_name',
        'customer_phone',
        'customer_email',
        'type',
        'address',
        'status',
        'total',
        'subtotal',
        'discount',
        'promo_code',
        'points_redeemed',
        'points_earned',
        'stock_returned',
    ];

    protected function casts(): array
    {
        return [
            'total' => 'decimal:2',
            'subtotal' => 'decimal:2',
            'discount' => 'decimal:2',
            'points_redeemed' => 'integer',
            'points_earned' => 'integer',
            'stock_returned' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }
}
