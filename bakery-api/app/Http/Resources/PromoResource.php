<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PromoResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'code' => $this->code,
            'type' => $this->type,
            'value' => $this->value,
            'min_total' => $this->min_total,
            'starts_at' => $this->starts_at?->toDateString(),
            'expires_at' => $this->expires_at?->toDateString(),
            'max_uses' => $this->max_uses,
            'used_count' => $this->used_count,
            'is_active' => $this->is_active,
            'is_usable_now' => $this->isUsableNow(),
        ];
    }
}
