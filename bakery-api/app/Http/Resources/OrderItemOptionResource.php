<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderItemOptionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'group_name_fr' => $this->group_name_fr,
            'group_name_en' => $this->group_name_en,
            'group_name_ar' => $this->group_name_ar,
            'name_fr' => $this->name_fr,
            'name_en' => $this->name_en,
            'name_ar' => $this->name_ar,
            'price_delta' => $this->price_delta,
        ];
    }
}
