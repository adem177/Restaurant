<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\CategoryResource;
use App\Http\Resources\ProductResource;
use App\Models\Allergen;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class AdminProductController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Product::with(['category', 'allergens', 'optionGroups.values']);

        if ($request->filled('search')) {
            $search = $request->string('search');
            $query->where(function ($q) use ($search) {
                $q->where('name_fr', 'like', "%{$search}%")
                    ->orWhere('name_ar', 'like', "%{$search}%");
            });
        }

        // out_of_stock=1 / low_stock=1 narrow the list to the alert cases.
        if ($request->boolean('out_of_stock')) {
            $query->whereNotNull('stock')->where('stock', '<=', 0);
        } elseif ($request->boolean('low_stock')) {
            $query->whereNotNull('stock')->where('stock', '>', 0)->where('stock', '<=', 5);
        }

        return ProductResource::collection(
            $query->orderBy('id')->paginate(15)
        );
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $this->validated($request);
        $codes = $validated['allergen_codes'] ?? [];
        unset($validated['allergen_codes']);

        $product = Product::create($validated);
        $product->allergens()->sync($this->idsFor($codes));

        return (new ProductResource($product->load(['category', 'allergens', 'optionGroups.values'])))->response()->setStatusCode(201);
    }

    public function show(Product $product): JsonResponse
    {
        return (new ProductResource($product->load(['category', 'allergens', 'optionGroups.values'])))->response();
    }

    public function update(Request $request, Product $product): JsonResponse
    {
        $validated = $this->validated($request, $product->id);
        $codes = $validated['allergen_codes'] ?? null;
        unset($validated['allergen_codes']);

        $product->update($validated);

        if ($codes !== null) {
            $product->allergens()->sync($this->idsFor($codes));
        }

        return (new ProductResource($product->fresh(['category', 'allergens', 'optionGroups.values'])))->response();
    }

    public function destroy(Product $product): JsonResponse
    {
        $product->delete();

        return response()->json(['message' => 'Product deleted.']);
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request, ?int $productId = null): array
    {
        return $request->validate([
            'category_id' => ['required', 'integer', 'exists:categories,id'],
            'name_fr' => ['required', 'string', 'max:255'],
            'name_ar' => ['required', 'string', 'max:255'],
            'name_en' => ['nullable', 'string', 'max:255'],
            'description_fr' => ['nullable', 'string'],
            'description_ar' => ['nullable', 'string'],
            'description_en' => ['nullable', 'string'],
            'price' => ['required', 'numeric', 'min:0'],
            // NULL = unlimited stock, 0 = sold out.
            'stock' => ['nullable', 'integer', 'min:0'],
            'calories' => ['nullable', 'integer', 'min:0', 'max:10000'],
            'carbs_g' => ['nullable', 'numeric', 'min:0', 'max:999.9'],
            'fat_g' => ['nullable', 'numeric', 'min:0', 'max:999.9'],
            'protein_g' => ['nullable', 'numeric', 'min:0', 'max:999.9'],
            'image' => ['nullable', 'string', 'max:255'],
            'is_vegetarian' => ['boolean'],
            'is_gluten_free' => ['boolean'],
            'is_featured' => ['boolean'],
            // Allergen codes to attach to the product (replaces the current set).
            'allergen_codes' => ['array'],
            'allergen_codes.*' => ['string', 'exists:allergens,code'],
        ]);
    }

    public function categories(): AnonymousResourceCollection
    {
        return CategoryResource::collection(
            Category::orderBy('id')->get()
        );
    }

    /**
     * Resolve allergen codes to their primary keys for the pivot table.
     *
     * @param  array<int, string>  $codes
     * @return array<int, int>
     */
    private function idsFor(array $codes): array
    {
        if ($codes === []) {
            return [];
        }

        return Allergen::whereIn('code', $codes)->pluck('id')->all();
    }
}
