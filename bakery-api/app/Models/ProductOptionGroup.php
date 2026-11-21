<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProductOptionGroup extends Model
{
    protected $fillable = [
        'product_id',
        'name_fr',
        'name_en',
        'name_ar',
        'selection',
        'is_required',
        'position',
    ];

    protected function casts(): array
    {
        return [
            'is_required' => 'boolean',
            'position' => 'integer',
        ];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function values(): HasMany
    {
        return $this->hasMany(ProductOptionValue::class)->orderBy('position')->orderBy('id');
    }

    public function isSingle(): bool
    {
        return $this->selection === 'single';
    }
}
