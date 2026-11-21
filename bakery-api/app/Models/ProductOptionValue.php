<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductOptionValue extends Model
{
    protected $fillable = [
        'product_option_group_id',
        'name_fr',
        'name_en',
        'name_ar',
        'price_delta',
        'position',
    ];

    protected function casts(): array
    {
        return [
            'price_delta' => 'decimal:2',
            'position' => 'integer',
        ];
    }

    public function group(): BelongsTo
    {
        return $this->belongsTo(ProductOptionGroup::class, 'product_option_group_id');
    }

    public function product(): BelongsTo
    {
        return $this->group->product();
    }
}
