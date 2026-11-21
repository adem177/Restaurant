<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderItemOption extends Model
{
    protected $fillable = [
        'order_item_id',
        'product_option_value_id',
        'group_name_fr',
        'group_name_en',
        'group_name_ar',
        'name_fr',
        'name_en',
        'name_ar',
        'price_delta',
    ];

    protected function casts(): array
    {
        return [
            'price_delta' => 'decimal:2',
        ];
    }

    public function item(): BelongsTo
    {
        return $this->belongsTo(OrderItem::class, 'order_item_id');
    }
}
