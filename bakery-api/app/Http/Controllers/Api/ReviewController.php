<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ReviewResource;
use App\Models\Product;
use App\Models\Review;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ReviewController extends Controller
{
    /**
     * Public: approved reviews for a product, newest first.
     */
    public function index(Product $product): AnonymousResourceCollection
    {
        return ReviewResource::collection(
            $product->reviews()
                ->where('status', 'approved')
                ->with('user:id,name')
                ->latest()
                ->get()
        );
    }

    /**
     * Authenticated: create or update the client's own review
     * (one review per client per product).
     */
    public function store(Request $request, Product $product): JsonResponse
    {
        $validated = $request->validate([
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'comment' => ['nullable', 'string', 'max:1000'],
        ]);

        $review = Review::updateOrCreate(
            [
                'user_id' => $request->user()->id,
                'product_id' => $product->id,
            ],
            [
                'rating' => $validated['rating'],
                'comment' => $validated['comment'] ?? null,
                'status' => 'approved',
            ],
        );

        return (new ReviewResource($review->load('user:id,name')))
            ->response()
            ->setStatusCode($review->wasRecentlyCreated ? 201 : 200);
    }

    /**
     * Delete a review: the author or any staff member.
     */
    public function destroy(Request $request, Review $review): JsonResponse
    {
        $user = $request->user();

        if ($review->user_id !== $user->id && ! $user->isStaff()) {
            abort(403, 'You can only delete your own review.');
        }

        $review->delete();

        return response()->json(['message' => 'Review deleted.']);
    }
}
