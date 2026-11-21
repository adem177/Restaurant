<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'customer_name' => $this->customer_name,
            'customer_phone' => $this->customer_phone,
            'customer_email' => $this->customer_email,
            'type' => $this->type,
            'address' => $this->address,
            'status' => $this->status,
            'total' => $this->total,
            'subtotal' => $this->subtotal,
            'discount' => $this->discount,
            'promo_code' => $this->promo_code,
            'points_redeemed' => $this->points_redeemed,
            'points_earned' => $this->points_earned,
            'items' => OrderItemResource::collection($this->whenLoaded('items')),
            'created_at' => $this->created_at,
        ];
    }
}
