<?php

namespace App\Models;

use Database\Factories\ProductFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    /** @use HasFactory<ProductFactory> */
    use HasFactory;

    protected $fillable = [
        'category_id',
        'name_fr',
        'name_ar',
        'name_en',
        'description_fr',
        'description_ar',
        'description_en',
        'price',
        'stock',
        'calories',
        'carbs_g',
        'fat_g',
        'protein_g',
        'image',
        'is_vegetarian',
        'is_gluten_free',
        'is_featured',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'stock' => 'integer',
            'calories' => 'integer',
            'carbs_g' => 'decimal:1',
            'fat_g' => 'decimal:1',
            'protein_g' => 'decimal:1',
            'is_vegetarian' => 'boolean',
            'is_gluten_free' => 'boolean',
            'is_featured' => 'boolean',
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }

    public function allergens(): BelongsToMany
    {
        return $this->belongsToMany(Allergen::class, 'product_allergen')->withTimestamps();
    }

    /**
     * Ordered as placed, so "Taille" renders before "Extras".
     *
     * @return HasMany<ProductOptionGroup>
     */
    public function optionGroups(): HasMany
    {
        return $this->hasMany(ProductOptionGroup::class)->orderBy('position')->orderBy('id');
    }

    /**
     * Whether the product can currently be sold (NULL stock = unlimited).
     */
    public function inStock(): bool
    {
        return $this->stock === null || $this->stock > 0;
    }
}
