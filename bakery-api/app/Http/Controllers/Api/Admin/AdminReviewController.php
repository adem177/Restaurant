<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\ReviewResource;
use App\Models\Review;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class AdminReviewController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Review::with(['user:id,name', 'product:id,name_fr']);

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        return ReviewResource::collection(
            $query->latest()->paginate(15)
        );
    }

    /**
     * Approve or reject a review (moderation).
     */
    public function updateStatus(Request $request, Review $review): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'in:approved,rejected'],
        ]);

        $review->update($validated);

        return (new ReviewResource($review->load(['user:id,name', 'product:id,name_fr'])))->response();
    }

    public function destroy(Review $review): JsonResponse
    {
        $review->delete();

        return response()->json(['message' => 'Review deleted.']);
    }
}
