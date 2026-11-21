<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'category_id' => $this->category_id,
            'name_fr' => $this->name_fr,
            'name_ar' => $this->name_ar,
            'name_en' => $this->name_en,
            'description_fr' => $this->description_fr,
            'description_ar' => $this->description_ar,
            'description_en' => $this->description_en,
            'price' => $this->price,
            'stock' => $this->stock,
            'in_stock' => $this->inStock(),
            // Per-portion nutrition; NULL means "not published".
            'calories' => $this->calories,
            'carbs_g' => $this->carbs_g,
            'fat_g' => $this->fat_g,
            'protein_g' => $this->protein_g,
            'image' => $this->image,
            'is_vegetarian' => $this->is_vegetarian,
            'is_gluten_free' => $this->is_gluten_free,
            'is_featured' => $this->is_featured,
            'rating_avg' => isset($this->rating_avg) && $this->rating_avg !== null
                ? round((float) $this->rating_avg, 1)
                : null,
            'reviews_count' => (int) ($this->reviews_count ?? 0),
            'category' => new CategoryResource($this->whenLoaded('category')),
            'allergens' => AllergenResource::collection($this->whenLoaded('allergens')),
            'option_groups' => ProductOptionGroupResource::collection($this->whenLoaded('optionGroups')),
            'reviews' => ReviewResource::collection($this->whenLoaded('reviews')),
        ];
    }
}
