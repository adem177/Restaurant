<?php

namespace App\Models;

use Database\Factories\AllergenFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Allergen extends Model
{
    /** @use HasFactory<AllergenFactory> */
    use HasFactory;

    protected $fillable = [
        'code',
        'name_fr',
        'name_en',
        'name_ar',
    ];

    public function products(): BelongsToMany
    {
        return $this->belongsToMany(Product::class, 'product_allergen')->withTimestamps();
    }
}
