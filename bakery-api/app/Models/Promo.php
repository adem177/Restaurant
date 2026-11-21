<?php

namespace App\Models;

use Database\Factories\PromoFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Promo extends Model
{
    /** @use HasFactory<PromoFactory> */
    use HasFactory;

    protected $fillable = [
        'code',
        'type',
        'value',
        'min_total',
        'starts_at',
        'expires_at',
        'max_uses',
        'used_count',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'value' => 'decimal:2',
            'min_total' => 'decimal:2',
            'starts_at' => 'datetime',
            'expires_at' => 'datetime',
            'max_uses' => 'integer',
            'used_count' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    /**
     * Find an active promo by code (case-insensitive) if it is currently usable.
     */
    public function findUsable(string $code): ?self
    {
        $promo = self::whereRaw('UPPER(code) = ?', [strtoupper(trim($code))])->first();

        if (! $promo) {
            return null;
        }

        return $promo->isUsableNow() ? $promo : null;
    }

    public function isUsableNow(): bool
    {
        if (! $this->is_active) {
            return false;
        }

        $now = now();

        if ($this->starts_at && $now->lt($this->starts_at)) {
            return false;
        }

        if ($this->expires_at && $now->gt($this->expires_at)) {
            return false;
        }

        if ($this->max_uses !== null && $this->used_count >= $this->max_uses) {
            return false;
        }

        return true;
    }

    /**
     * Discount in DT for a given subtotal.
     */
    public function discountFor(float $subtotal): float
    {
        $discount = $this->type === 'percent'
            ? $subtotal * ((float) $this->value) / 100
            : (float) $this->value;

        return round(min($discount, $subtotal), 2);
    }
}
