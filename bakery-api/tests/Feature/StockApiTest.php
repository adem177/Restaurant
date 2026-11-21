<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StockApiTest extends TestCase
{
    use RefreshDatabase;

    private function checkout(User $user, Product $product, int $quantity = 1, array $extra = [])
    {
        return $this->actingAs($user, 'sanctum')->postJson('/api/orders', array_merge([
            'customer_name' => $user->name,
            'customer_phone' => '0600000000',
            'customer_email' => $user->email,
            'type' => 'pickup',
            'items' => [['product_id' => $product->id, 'quantity' => $quantity]],
        ], $extra));
    }

    public function test_null_stock_means_unlimited_and_is_never_decremented(): void
    {
        $client = User::factory()->client()->create();
        $product = Product::factory()->unlimitedStock()->create(['price' => 5.00]);

        $this->checkout($client, $product, 5)->assertCreated();

        $this->assertNull($product->fresh()->stock);
    }

    public function test_stock_is_decremented_on_order(): void
    {
        $client = User::factory()->client()->create();
        $product = Product::factory()->withStock(10)->create(['price' => 5.00]);

        $this->checkout($client, $product, 3)->assertCreated();

        $this->assertSame(7, $product->fresh()->stock);
    }

    public function test_ordering_more_than_stock_is_rejected(): void
    {
        $client = User::factory()->client()->create();
        $product = Product::factory()->withStock(2)->create(['price' => 5.00]);

        $this->checkout($client, $product, 3)
            ->assertUnprocessable()
            ->assertJsonValidationErrors('items');

        $this->assertSame(2, $product->fresh()->stock);
        $this->assertSame(0, Order::count());
    }

    public function test_ordering_a_sold_out_product_is_rejected(): void
    {
        $client = User::factory()->client()->create();
        $product = Product::factory()->outOfStock()->create(['price' => 5.00]);

        $this->checkout($client, $product)
            ->assertUnprocessable()
            ->assertJsonValidationErrors('items');

        $this->assertSame(0, $product->fresh()->stock);
    }

    public function test_duplicate_product_lines_are_summed_before_checking_stock(): void
    {
        $client = User::factory()->client()->create();
        $product = Product::factory()->withStock(3)->create(['price' => 5.00]);

        $response = $this->actingAs($client, 'sanctum')->postJson('/api/orders', [
            'customer_name' => $client->name,
            'customer_phone' => '0600000000',
            'customer_email' => $client->email,
            'type' => 'pickup',
            'items' => [
                ['product_id' => $product->id, 'quantity' => 2],
                ['product_id' => $product->id, 'quantity' => 2],
            ],
        ]);

        $response->assertUnprocessable()->assertJsonValidationErrors('items');
        $this->assertSame(3, $product->fresh()->stock);
    }

    public function test_stock_is_returned_when_an_order_is_cancelled(): void
    {
        $admin = User::factory()->admin()->create();
        $client = User::factory()->client()->create();
        $product = Product::factory()->withStock(10)->create(['price' => 5.00]);

        $order = $this->checkout($client, $product, 4)->assertCreated()->json('data.id');
        $this->assertSame(6, $product->fresh()->stock);

        $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/admin/orders/{$order}/status", ['status' => 'cancelled'])
            ->assertOk();

        $this->assertSame(10, $product->fresh()->stock);
    }

    public function test_cancelling_twice_does_not_return_stock_twice(): void
    {
        $admin = User::factory()->admin()->create();
        $client = User::factory()->client()->create();
        $product = Product::factory()->withStock(10)->create(['price' => 5.00]);

        $order = $this->checkout($client, $product, 4)->json('data.id');

        $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/admin/orders/{$order}/status", ['status' => 'cancelled'])
            ->assertOk();
        $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/admin/orders/{$order}/status", ['status' => 'cancelled'])
            ->assertOk();

        $this->assertSame(10, $product->fresh()->stock);
        $this->assertTrue($order && Order::find($order)->stock_returned);
    }

    public function test_unlimited_stock_is_not_affected_by_cancellation(): void
    {
        $admin = User::factory()->admin()->create();
        $client = User::factory()->client()->create();
        $product = Product::factory()->unlimitedStock()->create(['price' => 5.00]);

        $order = $this->checkout($client, $product, 4)->json('data.id');

        $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/admin/orders/{$order}/status", ['status' => 'cancelled'])
            ->assertOk();

        $this->assertNull($product->fresh()->stock);
    }

    /*
    |--------------------------------------------------------------------------
    | Listing & preview
    |--------------------------------------------------------------------------
    */

    public function test_products_expose_stock_and_in_stock_flag(): void
    {
        Product::factory()->unlimitedStock()->create();
        Product::factory()->withStock(7)->create();
        Product::factory()->outOfStock()->create();

        $response = $this->getJson('/api/products')->assertOk()->json('data');

        $this->assertCount(3, $response);
        $this->assertTrue($response[0]['in_stock']);
        $this->assertTrue($response[1]['in_stock']);
        $this->assertFalse($response[2]['in_stock']);
        $this->assertSame(0, $response[2]['stock']);
    }

    public function test_available_filter_hides_sold_out_products(): void
    {
        Product::factory()->outOfStock()->create(['name_fr' => 'Épuisé']);
        Product::factory()->withStock(5)->create(['name_fr' => 'Dispo']);
        Product::factory()->unlimitedStock()->create(['name_fr' => 'Illimité']);

        $names = collect($this->getJson('/api/products?available=1')->assertOk()->json('data'))
            ->pluck('name_fr')
            ->all();

        $this->assertSame(['Dispo', 'Illimité'], $names);
    }

    public function test_preview_rejects_more_than_available_stock(): void
    {
        $client = User::factory()->client()->create();
        $product = Product::factory()->withStock(1)->create(['price' => 5.00]);

        $this->actingAs($client, 'sanctum')->postJson('/api/orders/preview', [
            'type' => 'pickup',
            'items' => [['product_id' => $product->id, 'quantity' => 2]],
        ])->assertUnprocessable()->assertJsonValidationErrors('items');
    }

    public function test_preview_passes_when_stock_is_sufficient(): void
    {
        $client = User::factory()->client()->create();
        $product = Product::factory()->withStock(5)->create(['price' => 10.00]);

        $response = $this->actingAs($client, 'sanctum')->postJson('/api/orders/preview', [
            'type' => 'pickup',
            'items' => [['product_id' => $product->id, 'quantity' => 2]],
        ]);

        $response->assertOk();
        $this->assertEqualsWithDelta(20.00, (float) $response->json('subtotal'), 0.01);
    }

    /*
    |--------------------------------------------------------------------------
    | Admin
    |--------------------------------------------------------------------------
    */

    public function test_admin_can_set_and_clear_stock(): void
    {
        $admin = User::factory()->admin()->create();
        $product = Product::factory()->create();

        $this->actingAs($admin, 'sanctum')->putJson("/api/admin/products/{$product->id}", [
            'category_id' => $product->category_id,
            'name_fr' => $product->name_fr,
            'name_ar' => $product->name_ar,
            'price' => 10.00,
            'stock' => 12,
        ])->assertOk()->assertJsonPath('data.stock', 12);

        $this->actingAs($admin, 'sanctum')->putJson("/api/admin/products/{$product->id}", [
            'category_id' => $product->category_id,
            'name_fr' => $product->name_fr,
            'name_ar' => $product->name_ar,
            'price' => 10.00,
            'stock' => null,
        ])->assertOk()->assertJsonPath('data.stock', null);
    }

    public function test_negative_stock_is_rejected(): void
    {
        $admin = User::factory()->admin()->create();
        $product = Product::factory()->create();

        $this->actingAs($admin, 'sanctum')->putJson("/api/admin/products/{$product->id}", [
            'category_id' => $product->category_id,
            'name_fr' => $product->name_fr,
            'name_ar' => $product->name_ar,
            'price' => 10.00,
            'stock' => -1,
        ])->assertUnprocessable()->assertJsonValidationErrors('stock');
    }

    public function test_admin_stats_report_out_of_stock_and_low_stock(): void
    {
        $admin = User::factory()->admin()->create();
        Product::factory()->outOfStock()->count(2)->create();
        Product::factory()->lowStock()->count(3)->create();
        Product::factory()->withStock(50)->count(4)->create();
        Product::factory()->unlimitedStock()->count(5)->create();

        $this->actingAs($admin, 'sanctum')->getJson('/api/admin/stats')
            ->assertOk()
            ->assertJsonPath('overview.out_of_stock', 2)
            ->assertJsonPath('overview.low_stock', 3);
    }

    public function test_admin_product_list_can_filter_sold_out(): void
    {
        $admin = User::factory()->admin()->create();
        Product::factory()->outOfStock()->count(2)->create();
        Product::factory()->withStock(9)->count(3)->create();

        $this->actingAs($admin, 'sanctum')->getJson('/api/admin/products?out_of_stock=1')
            ->assertOk()
            ->assertJsonCount(2, 'data');
    }
}
