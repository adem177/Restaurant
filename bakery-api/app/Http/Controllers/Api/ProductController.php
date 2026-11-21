<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ProductController extends Controller
{
    /**
     * List products with optional filters.
     *
     * Query params: category (slug), vegetarian, gluten_free, search, featured,
     *               available (in-stock only), exclude_allergen (codes, comma separated)
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = $this->withReviewAggregates();

        if ($request->filled('category')) {
            $query->whereHas('category', function ($q) use ($request) {
                $q->where('slug', $request->string('category'));
            });
        }

        if ($request->boolean('vegetarian')) {
            $query->where('is_vegetarian', true);
        }

        if ($request->boolean('gluten_free')) {
            $query->where('is_gluten_free', true);
        }

        if ($request->boolean('featured')) {
            $query->where('is_featured', true);
        }

        // available=1 hides sold-out products (NULL stock = unlimited).
        if ($request->boolean('available')) {
            $query->where(function ($q) {
                $q->whereNull('stock')->orWhere('stock', '>', 0);
            });
        }

        // exclude_allergen=gluten,milk hides products containing any of them.
        if ($request->filled('exclude_allergen')) {
            $codes = array_filter(explode(',', $request->string('exclude_allergen')->toString()));

            if ($codes !== []) {
                $query->whereDoesntHave('allergens', function ($q) use ($codes) {
                    $q->whereIn('code', $codes);
                });
            }
        }

        if ($request->filled('search')) {
            $search = $request->string('search');
            $query->where(function ($q) use ($search) {
                $q->where('name_fr', 'like', "%{$search}%")
                    ->orWhere('name_ar', 'like', "%{$search}%")
                    ->orWhere('name_en', 'like', "%{$search}%");
            });
        }

        return ProductResource::collection($query->orderBy('id')->paginate(12));
    }

    public function show(Product $product): JsonResponse
    {
        // Reload with aggregates + the approved reviews list for the modal.
        $product = Product::whereKey($product->id)
            ->withCount(['reviews as reviews_count' => fn ($q) => $q->where('status', 'approved')])
            ->withAvg(['reviews as rating_avg' => fn ($q) => $q->where('status', 'approved')], 'rating')
            ->with([
                'category',
                'allergens',
                'optionGroups.values',
                'reviews' => fn ($q) => $q->where('status', 'approved')->with('user:id,name'),
            ])
            ->firstOrFail();

        return (new ProductResource($product))->response();
    }

    /**
     * Eager-load approved-review aggregates (count + average) without N+1.
     */
    private function withReviewAggregates(): Builder
    {
        return Product::with(['category', 'allergens', 'optionGroups.values'])
            ->withCount(['reviews as reviews_count' => fn ($q) => $q->where('status', 'approved')])
            ->withAvg(['reviews as rating_avg' => fn ($q) => $q->where('status', 'approved')], 'rating');
    }
}
