<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReviewResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'product_id' => $this->product_id,
            'rating' => $this->rating,
            'comment' => $this->comment,
            'status' => $this->status,
            'created_at' => $this->created_at?->toDateString(),
            // Only expose the reviewer's first name.
            'author' => $this->whenLoaded('user', fn () => $this->user?->name),
            'is_mine' => $request->user()?->id === $this->user_id,
        ];
    }
}
