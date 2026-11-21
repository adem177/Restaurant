<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Product;
use App\Models\ProductOptionGroup;
use App\Models\ProductOptionValue;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FormuleApiTest extends TestCase
{
    use RefreshDatabase;

    /**
     * An "Express" formule at 32 DT with three required single-choice courses:
     * starter, main (premium dishes add a supplement) and dessert. This mirrors
     * how FormuleSeeder builds a set menu on top of the option system.
     */
    private function formule(): Product
    {
        $formule = Product::factory()->create(['name_fr' => 'Formule express', 'price' => 32.00]);

        $courses = [
            ['Starter', 'المقبلات', [['Bruschetta', 0.00], ['Salade César', 0.00]]],
            ['Main course', 'الطبق', [['Burger maison', 0.00], ['Steak-frites', 4.00]]],
            ['Dessert', 'الحلوى', [['Tiramisu', 0.00], ['Fondant au chocolat', 2.00]]],
        ];

        foreach ($courses as $position => [$nameFr, $nameAr, $values]) {
            $group = ProductOptionGroup::create([
                'product_id' => $formule->id,
                'name_fr' => $nameFr,
                'name_en' => $nameFr,
                'name_ar' => $nameAr,
                'selection' => 'single',
                'is_required' => true,
                'position' => $position,
            ]);

            foreach ($values as $i => [$label, $delta]) {
                ProductOptionValue::create([
                    'product_option_group_id' => $group->id,
                    'name_fr' => $label,
                    'name_en' => $label,
                    'name_ar' => $label,
                    'price_delta' => $delta,
                    'position' => $i,
                ]);
            }
        }

        return $formule;
    }

    private function value(Product $formule, string $group, string $label): int
    {
        return $formule->optionGroups()->where('name_fr', $group)->first()
            ->values()->where('name_fr', $label)->first()->id;
    }

    private function checkout(User $user, Product $formule, array $optionIds)
    {
        return $this->actingAs($user, 'sanctum')->postJson('/api/orders', [
            'customer_name' => $user->name,
            'customer_phone' => '0600000000',
            'type' => 'pickup',
            'items' => [['product_id' => $formule->id, 'quantity' => 1, 'options' => $optionIds]],
        ]);
    }

    public function test_formule_prices_the_chosen_courses_including_supplements(): void
    {
        $user = User::factory()->client()->create();
        $formule = $this->formule();

        // 32 base + 4 (Steak-frites) + 2 (Fondant) = 38.00
        $this->checkout($user, $formule, [
            $this->value($formule, 'Starter', 'Bruschetta'),
            $this->value($formule, 'Main course', 'Steak-frites'),
            $this->value($formule, 'Dessert', 'Fondant au chocolat'),
        ])->assertCreated()->assertJsonPath('data.total', '38.00');
    }

    public function test_formule_without_supplements_costs_the_base_price(): void
    {
        $user = User::factory()->client()->create();
        $formule = $this->formule();

        $this->checkout($user, $formule, [
            $this->value($formule, 'Starter', 'Salade César'),
            $this->value($formule, 'Main course', 'Burger maison'),
            $this->value($formule, 'Dessert', 'Tiramisu'),
        ])->assertCreated()->assertJsonPath('data.total', '32.00');
    }

    public function test_formule_requires_one_choice_per_course(): void
    {
        $user = User::factory()->client()->create();
        $formule = $this->formule();

        // Missing the dessert course.
        $this->checkout($user, $formule, [
            $this->value($formule, 'Starter', 'Bruschetta'),
            $this->value($formule, 'Main course', 'Burger maison'),
        ])->assertUnprocessable()->assertJsonValidationErrors('items.options');

        $this->assertSame(0, Order::count());
    }

    public function test_formule_snapshots_each_chosen_course(): void
    {
        $user = User::factory()->client()->create();
        $formule = $this->formule();

        $orderId = $this->checkout($user, $formule, [
            $this->value($formule, 'Starter', 'Bruschetta'),
            $this->value($formule, 'Main course', 'Steak-frites'),
            $this->value($formule, 'Dessert', 'Tiramisu'),
        ])->json('data.id');

        $options = Order::find($orderId)->items()->first()->options()->orderBy('id')->get();

        $this->assertCount(3, $options);
        $this->assertSame(
            ['Starter', 'Main course', 'Dessert'],
            $options->pluck('group_name_fr')->all()
        );
        $this->assertSame(
            ['Bruschetta', 'Steak-frites', 'Tiramisu'],
            $options->pluck('name_fr')->all()
        );
    }
}
