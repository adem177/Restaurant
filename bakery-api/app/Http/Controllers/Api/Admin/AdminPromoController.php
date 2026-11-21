<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\PromoResource;
use App\Models\Promo;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

class AdminPromoController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return PromoResource::collection(Promo::latest('id')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $promo = Promo::create($this->validated($request));

        return (new PromoResource($promo))->response()->setStatusCode(201);
    }

    public function update(Request $request, Promo $promo): JsonResponse
    {
        $promo->update($this->validated($request, $promo->id));

        return (new PromoResource($promo))->response();
    }

    public function destroy(Promo $promo): JsonResponse
    {
        $promo->delete();

        return response()->json(['message' => 'Promo deleted.']);
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request, ?int $promoId = null): array
    {
        return $request->validate([
            'code' => [
                'required', 'string', 'max:40', 'alpha_dash',
                Rule::unique('promos', 'code')->ignore($promoId),
            ],
            'type' => ['required', 'in:percent,fixed'],
            'value' => ['required', 'numeric', 'min:0.01'],
            'min_total' => ['nullable', 'numeric', 'min:0'],
            'starts_at' => ['nullable', 'date'],
            'expires_at' => ['nullable', 'date', 'after:starts_at'],
            'max_uses' => ['nullable', 'integer', 'min:1'],
            'is_active' => ['boolean'],
        ]);
    }
}
