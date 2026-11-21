<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_order_can_be_created_with_items_and_total_is_calculated(): void
    {
        $bread = Product::factory()->create(['price' => 4.00]);
        $pastry = Product::factory()->create(['price' => 8.00]);

        $response = $this->postJson('/api/orders', [
            'customer_name' => 'Test Client',
            'customer_phone' => '0612345678',
            'type' => 'pickup',
            'items' => [
                ['product_id' => $bread->id, 'quantity' => 2],
                ['product_id' => $pastry->id, 'quantity' => 1],
            ],
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.customer_name', 'Test Client')
            ->assertJsonPath('data.status', 'pending')
            ->assertJsonPath('data.total', '16.00')
            ->assertJsonCount(2, 'data.items');

        $this->assertDatabaseHas('orders', [
            'customer_name' => 'Test Client',
            'total' => 16.00,
        ]);
    }

    public function test_delivery_order_requires_address(): void
    {
        $product = Product::factory()->create();

        $response = $this->postJson('/api/orders', [
            'customer_name' => 'No Address',
            'customer_phone' => '0612345678',
            'type' => 'delivery',
            'items' => [
                ['product_id' => $product->id, 'quantity' => 1],
            ],
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors('address');
    }

    public function test_order_requires_at_least_one_item(): void
    {
        $response = $this->postJson('/api/orders', [
            'customer_name' => 'Empty Cart',
            'customer_phone' => '0612345678',
            'type' => 'pickup',
            'items' => [],
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors('items');
    }

    public function test_order_rejects_nonexistent_product(): void
    {
        $response = $this->postJson('/api/orders', [
            'customer_name' => 'Ghost',
            'customer_phone' => '0612345678',
            'type' => 'pickup',
            'items' => [
                ['product_id' => 9999, 'quantity' => 1],
            ],
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors('items.0.product_id');
    }

    public function test_order_show_returns_order_with_items(): void
    {
        $order = Order::factory()->create();
        $product = Product::factory()->create(['price' => 5.00]);
        $order->items()->create([
            'product_id' => $product->id,
            'quantity' => 2,
            'price' => 5.00,
        ]);

        $response = $this->getJson("/api/orders/{$order->id}");

        $response->assertOk()
            ->assertJsonPath('data.id', $order->id)
            ->assertJsonCount(1, 'data.items')
            ->assertJsonPath('data.items.0.quantity', 2);
    }
}
