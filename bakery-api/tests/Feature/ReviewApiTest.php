<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\Review;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReviewApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_reviews_list_only_shows_approved(): void
    {
        $product = Product::factory()->create();
        Review::factory()->create(['product_id' => $product->id, 'rating' => 5]);
        Review::factory()->rejected()->create(['product_id' => $product->id]);

        $response = $this->getJson("/api/products/{$product->id}/reviews");

        $response->assertOk()->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.rating', 5);
    }

    public function test_review_requires_authentication_to_create(): void
    {
        $product = Product::factory()->create();

        $this->postJson("/api/products/{$product->id}/reviews", [
            'rating' => 5,
        ])->assertUnauthorized();
    }

    public function test_authenticated_client_can_create_review(): void
    {
        $client = User::factory()->client()->create();
        $product = Product::factory()->create();

        $response = $this->actingAs($client, 'sanctum')
            ->postJson("/api/products/{$product->id}/reviews", [
                'rating' => 4,
                'comment' => 'Très bon !',
            ]);

        $response->assertCreated()
            ->assertJsonPath('data.rating', 4)
            ->assertJsonPath('data.is_mine', true);

        $this->assertDatabaseHas('reviews', [
            'product_id' => $product->id,
            'user_id' => $client->id,
            'rating' => 4,
        ]);
    }

    public function test_review_validates_rating_bounds(): void
    {
        $client = User::factory()->client()->create();
        $product = Product::factory()->create();

        $this->actingAs($client, 'sanctum')
            ->postJson("/api/products/{$product->id}/reviews", ['rating' => 6])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('rating');

        $this->actingAs($client, 'sanctum')
            ->postJson("/api/products/{$product->id}/reviews", ['rating' => 0])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('rating');
    }

    public function test_second_review_from_same_client_updates_existing(): void
    {
        $client = User::factory()->client()->create();
        $product = Product::factory()->create();

        $this->actingAs($client, 'sanctum')
            ->postJson("/api/products/{$product->id}/reviews", ['rating' => 3])->assertCreated();

        $this->actingAs($client, 'sanctum')
            ->postJson("/api/products/{$product->id}/reviews", ['rating' => 5])
            ->assertOk()
            ->assertJsonPath('data.rating', 5);

        $this->assertSame(1, Review::where('product_id', $product->id)->count());
    }

    public function test_product_show_includes_rating_aggregates(): void
    {
        $product = Product::factory()->create();
        Review::factory()->create(['product_id' => $product->id, 'rating' => 4]);
        Review::factory()->create(['product_id' => $product->id, 'rating' => 5]);
        Review::factory()->rejected()->create(['product_id' => $product->id, 'rating' => 1]);

        $response = $this->getJson("/api/products/{$product->id}");

        $response->assertOk()
            ->assertJsonPath('data.reviews_count', 2)
            ->assertJsonPath('data.rating_avg', 4.5);
    }

    public function test_products_index_includes_review_aggregates(): void
    {
        $product = Product::factory()->create();
        Review::factory()->create(['product_id' => $product->id, 'rating' => 5]);

        $response = $this->getJson('/api/products');

        $response->assertOk()->assertJsonPath('data.0.reviews_count', 1)
            ->assertJsonPath('data.0.rating_avg', 5);
    }

    public function test_author_can_delete_their_review(): void
    {
        $client = User::factory()->client()->create();
        $review = Review::factory()->create(['user_id' => $client->id]);

        $this->actingAs($client, 'sanctum')
            ->deleteJson("/api/reviews/{$review->id}")
            ->assertOk();

        $this->assertDatabaseMissing('reviews', ['id' => $review->id]);
    }

    public function test_other_client_cannot_delete_review(): void
    {
        $owner = User::factory()->client()->create();
        $other = User::factory()->client()->create();
        $review = Review::factory()->create(['user_id' => $owner->id]);

        $this->actingAs($other, 'sanctum')
            ->deleteJson("/api/reviews/{$review->id}")
            ->assertForbidden();
    }

    public function test_staff_can_delete_any_review(): void
    {
        $admin = User::factory()->admin()->create();
        $client = User::factory()->client()->create();
        $review = Review::factory()->create(['user_id' => $client->id]);

        $this->actingAs($admin, 'sanctum')
            ->deleteJson("/api/reviews/{$review->id}")
            ->assertOk();

        $this->assertDatabaseMissing('reviews', ['id' => $review->id]);
    }

    public function test_admin_can_moderate_review_status(): void
    {
        $admin = User::factory()->admin()->create();
        $review = Review::factory()->create(['status' => 'approved']);

        $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/admin/reviews/{$review->id}/status", ['status' => 'rejected'])
            ->assertOk()
            ->assertJsonPath('data.status', 'rejected');

        $this->assertDatabaseHas('reviews', ['id' => $review->id, 'status' => 'rejected']);
    }

    public function test_admin_reviews_index_can_filter_by_status(): void
    {
        $admin = User::factory()->admin()->create();
        Review::factory()->create(['status' => 'approved']);
        Review::factory()->rejected()->create();

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/admin/reviews?status=rejected')
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_moderation_requires_staff(): void
    {
        $client = User::factory()->client()->create();
        $review = Review::factory()->create();

        $this->actingAs($client, 'sanctum')
            ->getJson('/api/admin/reviews')
            ->assertForbidden();
    }
}
