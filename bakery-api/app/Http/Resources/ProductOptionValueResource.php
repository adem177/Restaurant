<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductOptionValueResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'product_option_group_id' => $this->product_option_group_id,
            'name_fr' => $this->name_fr,
            'name_en' => $this->name_en,
            'name_ar' => $this->name_ar,
            'price_delta' => $this->price_delta,
            'position' => $this->position,
        ];
    }
}
