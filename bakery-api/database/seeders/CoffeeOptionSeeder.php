<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Seeder;

/**
 * Adds a "Taille" (size) and an "Extras" option group to the coffee drinks.
 * Juices and sodas are served as-is, so they are left without options.
 * Idempotent: safe to run on an already-seeded database.
 */
class CoffeeOptionSeeder extends Seeder
{
    /** French names of the drinks that carry the coffee option groups. */
    private const COFFEE_DRINKS = [
        'Expresso',
        'Café crème',
        'Cappuccino',
        'Latte',
        'Moka',
        'Café glacé',
    ];

    /** @var array<string, array{fr: string, en: string, ar: string, delta: float}> */
    private const SIZES = [
        'small' => ['fr' => 'Petit', 'en' => 'Small', 'ar' => 'صغير', 'delta' => 0.00],
        'medium' => ['fr' => 'Moyen', 'en' => 'Medium', 'ar' => 'وسط', 'delta' => 1.50],
        'large' => ['fr' => 'Grand', 'en' => 'Large', 'ar' => 'كبير', 'delta' => 3.00],
    ];

    /** @var array<string, array{fr: string, en: string, ar: string, delta: float}> */
    private const EXTRAS = [
        'shot' => ['fr' => 'Shot d’espresso', 'en' => 'Extra espresso shot', 'ar' => 'جرعة إسبريسو إضافية', 'delta' => 2.00],
        'oat' => ['fr' => 'Lait d’avoine', 'en' => 'Oat milk', 'ar' => 'حليب الشوفان', 'delta' => 1.00],
        'decaf' => ['fr' => 'Décaféiné', 'en' => 'Decaf', 'ar' => 'بدون كافيين', 'delta' => 0.50],
        'nosugar' => ['fr' => 'Sans sucre', 'en' => 'No sugar', 'ar' => 'بدون سكر', 'delta' => 0.00],
    ];

    public function run(): void
    {
        $category = Category::where('slug', 'coffee')->first();

        if (! $category) {
            return;
        }

        $drinks = Product::where('category_id', $category->id)->get();

        foreach ($drinks as $drink) {
            if (! in_array($drink->name_fr, self::COFFEE_DRINKS, true)) {
                continue;
            }

            $this->syncGroup($drink, 'Taille', 'Size', 'الحجم', 'single', true, 0, self::SIZES);
            $this->syncGroup($drink, 'Extras', 'Extras', 'إضافات', 'multi', false, 1, self::EXTRAS);
        }
    }

    /**
     * Create (or update) one option group with its values on a drink.
     *
     * @param  array<string, array{fr: string, en: string, ar: string, delta: float}>  $options
     */
    private function syncGroup(
        Product $drink,
        string $nameFr,
        string $nameEn,
        string $nameAr,
        string $selection,
        bool $required,
        int $position,
        array $options,
    ): void {
        $group = $drink->optionGroups()->firstOrCreate(
            ['name_fr' => $nameFr],
            [
                'name_en' => $nameEn,
                'name_ar' => $nameAr,
                'selection' => $selection,
                'is_required' => $required,
                'position' => $position,
            ],
        );

        foreach (array_values($options) as $index => $option) {
            $group->values()->firstOrCreate(
                ['name_fr' => $option['fr']],
                [
                    'name_en' => $option['en'],
                    'name_ar' => $option['ar'],
                    'price_delta' => $option['delta'],
                    'position' => $index,
                ],
            );
        }
    }
}
