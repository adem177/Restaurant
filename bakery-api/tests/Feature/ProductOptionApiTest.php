<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Product;
use App\Models\ProductOptionGroup;
use App\Models\ProductOptionValue;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductOptionApiTest extends TestCase
{
    use RefreshDatabase;

    /**
     * A latte at 4.50 DT with a "Taille" group (single, required) and an
     * "Extras" group (multi, optional).
     */
    private function latte(): Product
    {
        $product = Product::factory()->create(['name_fr' => 'Latte', 'price' => 4.50]);

        $size = ProductOptionGroup::create([
            'product_id' => $product->id,
            'name_fr' => 'Taille',
            'name_en' => 'Size',
            'name_ar' => 'الحجم',
            'selection' => 'single',
            'is_required' => true,
            'position' => 0,
        ]);

        $extras = ProductOptionGroup::create([
            'product_id' => $product->id,
            'name_fr' => 'Extras',
            'name_en' => 'Extras',
            'name_ar' => 'إضافات',
            'selection' => 'multi',
            'is_required' => false,
            'position' => 1,
        ]);

        foreach ([['Petit', 0.00], ['Moyen', 1.50], ['Grand', 3.00]] as $i => [$name, $delta]) {
            ProductOptionValue::create([
                'product_option_group_id' => $size->id,
                'name_fr' => $name,
                'name_en' => $name,
                'name_ar' => $name,
                'price_delta' => $delta,
                'position' => $i,
            ]);
        }

        foreach ([['Shot', 2.00], ['Avoine', 1.00], ['Sans sucre', 0.00]] as $i => [$name, $delta]) {
            ProductOptionValue::create([
                'product_option_group_id' => $extras->id,
                'name_fr' => $name,
                'name_en' => $name,
                'name_ar' => $name,
                'price_delta' => $delta,
                'position' => $i,
            ]);
        }

        return $product;
    }

    private function checkout(User $user, Product $product, array $optionIds, int $quantity = 1)
    {
        return $this->actingAs($user, 'sanctum')->postJson('/api/orders', [
            'customer_name' => $user->name,
            'customer_phone' => '0600000000',
            'customer_email' => $user->email,
            'type' => 'pickup',
            'items' => [['product_id' => $product->id, 'quantity' => $quantity, 'options' => $optionIds]],
        ]);
    }

    private function sizeValue(Product $product, string $name): int
    {
        return $product->optionGroups()->first()->values()->where('name_fr', $name)->first()->id;
    }

    private function extraValue(Product $product, string $name): int
    {
        return $product->optionGroups()->where('name_fr', 'Extras')->first()
            ->values()->where('name_fr', $name)->first()->id;
    }

    /*
    |--------------------------------------------------------------------------
    | Pricing
    |--------------------------------------------------------------------------
    */

    public function test_option_deltas_are_added_to_the_unit_price(): void
    {
        $user = User::factory()->client()->create();
        $latte = $this->latte();

        // 4.50 base + 3.00 (Grand) = 7.50
        $this->checkout($user, $latte, [$this->sizeValue($latte, 'Grand')])
            ->assertCreated()
            ->assertJsonPath('data.total', '7.50');
    }

    public function test_several_extras_stack_on_top_of_the_size(): void
    {
        $user = User::factory()->client()->create();
        $latte = $this->latte();

        // 4.50 + 1.50 (Moyen) + 2.00 (Shot) + 1.00 (Avoine) = 9.00
        $this->checkout($user, $latte, [
            $this->sizeValue($latte, 'Moyen'),
            $this->extraValue($latte, 'Shot'),
            $this->extraValue($latte, 'Avoine'),
        ])->assertCreated()->assertJsonPath('data.total', '9.00');
    }

    public function test_order_without_options_uses_the_base_price_when_all_groups_are_optional(): void
    {
        $user = User::factory()->client()->create();
        $product = Product::factory()->create(['price' => 5.00]);

        $this->checkout($user, $product, [])
            ->assertCreated()
            ->assertJsonPath('data.total', '5.00');
    }

    public function test_order_item_price_includes_the_option_deltas(): void
    {
        $user = User::factory()->client()->create();
        $latte = $this->latte();

        $order = $this->checkout($user, $latte, [$this->sizeValue($latte, 'Grand')])
            ->assertCreated()
            ->json('data.id');

        $item = Order::find($order)->items()->first();

        $this->assertSame('7.50', (string) $item->price);
    }

    public function test_quantity_multiplies_the_option_aware_unit_price(): void
    {
        $user = User::factory()->client()->create();
        $latte = $this->latte();

        // 2 × (4.50 + 3.00) = 15.00
        $this->checkout($user, $latte, [$this->sizeValue($latte, 'Grand')], 2)
            ->assertCreated()
            ->assertJsonPath('data.total', '15.00');
    }

    /*
    |--------------------------------------------------------------------------
    | Group rules
    |--------------------------------------------------------------------------
    */

    public function test_required_group_must_be_chosen(): void
    {
        $user = User::factory()->client()->create();
        $latte = $this->latte();

        $this->checkout($user, $latte, [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('items.options');

        $this->assertSame(0, Order::count());
    }

    public function test_single_selection_group_rejects_two_choices(): void
    {
        $user = User::factory()->client()->create();
        $latte = $this->latte();

        $this->checkout($user, $latte, [
            $this->sizeValue($latte, 'Petit'),
            $this->sizeValue($latte, 'Grand'),
        ])->assertUnprocessable()->assertJsonValidationErrors('items.options');
    }

    public function test_optional_multi_group_may_be_left_empty(): void
    {
        $user = User::factory()->client()->create();
        $latte = $this->latte();

        $this->checkout($user, $latte, [$this->sizeValue($latte, 'Petit')])
            ->assertCreated()
            ->assertJsonPath('data.total', '4.50');
    }

    public function test_multi_group_accepts_several_choices(): void
    {
        $user = User::factory()->client()->create();
        $latte = $this->latte();

        $this->checkout($user, $latte, [
            $this->sizeValue($latte, 'Petit'),
            $this->extraValue($latte, 'Shot'),
            $this->extraValue($latte, 'Sans sucre'),
        ])->assertCreated()->assertJsonPath('data.total', '6.50');
    }

    public function test_options_belonging_to_another_product_are_rejected(): void
    {
        $user = User::factory()->client()->create();
        $latte = $this->latte();
        $other = Product::factory()->create(['name_fr' => 'Moka', 'price' => 5.00]);

        $this->checkout($user, $other, [$this->sizeValue($latte, 'Grand')])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('items.options');
    }

    public function test_a_product_without_groups_ignores_nothing_and_accepts_no_options(): void
    {
        $user = User::factory()->client()->create();
        $product = Product::factory()->create(['price' => 3.00]);
        $stray = $this->latte();

        // Passing an option id that belongs to another product must fail.
        $this->checkout($user, $product, [$this->sizeValue($stray, 'Grand')])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('items.options');
    }

    public function test_unknown_option_id_is_rejected_by_validation(): void
    {
        $user = User::factory()->client()->create();
        $latte = $this->latte();

        $this->checkout($user, $latte, [999999])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('items.0.options.0');
    }

    /*
    |--------------------------------------------------------------------------
    | Snapshot & preview
    |--------------------------------------------------------------------------
    */

    public function test_selected_options_are_snapshotted_on_the_order_item(): void
    {
        $user = User::factory()->client()->create();
        $latte = $this->latte();

        $orderId = $this->checkout($user, $latte, [
            $this->sizeValue($latte, 'Grand'),
            $this->extraValue($latte, 'Shot'),
        ])->json('data.id');

        $item = Order::find($orderId)->items()->first();
        $options = $item->options()->orderBy('id')->get();

        $this->assertCount(2, $options);
        $this->assertSame('Taille', $options[0]->group_name_fr);
        $this->assertSame('Grand', $options[0]->name_fr);
        $this->assertSame('3.00', (string) $options[0]->price_delta);
        $this->assertSame('Extras', $options[1]->group_name_fr);
        $this->assertSame('Shot', $options[1]->name_fr);
    }

    public function test_order_response_exposes_the_selected_options(): void
    {
        $user = User::factory()->client()->create();
        $latte = $this->latte();

        $orderId = $this->checkout($user, $latte, [$this->sizeValue($latte, 'Grand')])->json('data.id');

        $data = $this->actingAs($user, 'sanctum')
            ->getJson("/api/orders/{$orderId}")
            ->assertOk()
            ->json('data.items.0.options');

        $this->assertCount(1, $data);
        $this->assertSame('Grand', $data[0]['name_fr']);
    }

    public function test_snapshot_survives_later_menu_edits(): void
    {
        $user = User::factory()->client()->create();
        $latte = $this->latte();
        $value = ProductOptionValue::find($this->sizeValue($latte, 'Grand'));

        $orderId = $this->checkout($user, $latte, [$value->id])->json('data.id');

        $value->update(['name_fr' => 'Très grand', 'price_delta' => 5.00]);

        $option = Order::find($orderId)->items()->first()->options()->first();

        $this->assertSame('Grand', $option->name_fr);
        $this->assertSame('3.00', (string) $option->price_delta);
    }

    public function test_deleting_an_option_keeps_the_order_snapshot(): void
    {
        $user = User::factory()->client()->create();
        $latte = $this->latte();
        $value = ProductOptionValue::find($this->sizeValue($latte, 'Grand'));

        $orderId = $this->checkout($user, $latte, [$value->id])->json('data.id');

        $value->delete();

        $option = Order::find($orderId)->items()->first()->options()->first();

        $this->assertNotNull($option);
        $this->assertSame('Grand', $option->name_fr);
        $this->assertNull($option->product_option_value_id);
    }

    public function test_preview_accounts_for_option_deltas(): void
    {
        $user = User::factory()->client()->create();
        $latte = $this->latte();

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/orders/preview', [
            'type' => 'pickup',
            'items' => [[
                'product_id' => $latte->id,
                'quantity' => 2,
                'options' => [$this->sizeValue($latte, 'Grand')],
            ]],
        ]);

        $response->assertOk();
        $this->assertEqualsWithDelta(15.00, (float) $response->json('subtotal'), 0.01);
    }

    public function test_preview_rejects_a_missing_required_group(): void
    {
        $user = User::factory()->client()->create();
        $latte = $this->latte();

        $this->actingAs($user, 'sanctum')->postJson('/api/orders/preview', [
            'type' => 'pickup',
            'items' => [['product_id' => $latte->id, 'quantity' => 1, 'options' => []]],
        ])->assertUnprocessable()->assertJsonValidationErrors('items.options');
    }

    /*
    |--------------------------------------------------------------------------
    | Catalogue & stock
    |--------------------------------------------------------------------------
    */

    public function test_product_resource_exposes_option_groups_and_values(): void
    {
        $latte = $this->latte();

        $data = $this->getJson("/api/products/{$latte->id}")->assertOk()->json('data');

        $this->assertCount(2, $data['option_groups']);

        $size = collect($data['option_groups'])->firstWhere('name_fr', 'Taille');

        $this->assertTrue($size['is_required']);
        $this->assertSame('single', $size['selection']);
        $this->assertCount(3, $size['values']);
        $this->assertSame('3.00', $size['values'][2]['price_delta']);
    }

    public function test_stock_is_checked_against_option_priced_lines(): void
    {
        $user = User::factory()->client()->create();
        $latte = $this->latte();
        $latte->update(['stock' => 1]);

        // 2 lattes, but only 1 in stock: the option price does not bypass the check.
        $this->checkout($user, $latte, [$this->sizeValue($latte, 'Grand')], 2)
            ->assertUnprocessable()
            ->assertJsonValidationErrors('items');

        $this->assertSame(1, $latte->fresh()->stock);
    }

    public function test_cancelling_an_order_still_restocks_with_options(): void
    {
        $admin = User::factory()->admin()->create();
        $user = User::factory()->client()->create();
        $latte = $this->latte();
        $latte->update(['stock' => 10]);

        $orderId = $this->checkout($user, $latte, [$this->sizeValue($latte, 'Grand')])->json('data.id');

        $this->assertSame(9, $latte->fresh()->stock);

        $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/admin/orders/{$orderId}/status", ['status' => 'cancelled'])
            ->assertOk();

        $this->assertSame(10, $latte->fresh()->stock);
    }

    public function test_a_product_with_options_can_be_ordered_without_options_by_the_seeder_default(): void
    {
        $user = User::factory()->client()->create();
        $latte = $this->latte();

        // "Petit" costs nothing extra, so the base price is unchanged.
        $this->checkout($user, $latte, [$this->sizeValue($latte, 'Petit')])
            ->assertCreated()
            ->assertJsonPath('data.total', '4.50');
    }
}
