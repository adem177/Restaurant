<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductOptionGroupResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name_fr' => $this->name_fr,
            'name_en' => $this->name_en,
            'name_ar' => $this->name_ar,
            'selection' => $this->selection,
            'is_required' => $this->is_required,
            'position' => $this->position,
            'values' => ProductOptionValueResource::collection($this->whenLoaded('values')),
        ];
    }
}
