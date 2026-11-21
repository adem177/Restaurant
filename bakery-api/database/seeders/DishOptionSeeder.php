<?php

namespace Database\Seeders;

use App\Models\Product;
use Illuminate\Database\Seeder;

/**
 * Adds cooking ("Cuisson") and customisation ("Suppléments") option groups to
 * the restaurant dishes. The cook group is required on red meat only; the
 * extras group is optional across the mains.
 * Idempotent: safe to run on an already-seeded database.
 */
class DishOptionSeeder extends Seeder
{
    /** Red-meat dishes that get the required "Cuisson" (cook) group. */
    private const COOK_DISHES = [
        'Steak-frites',
        'Grillade mixte',
    ];

    /** Mains that get the optional "Suppléments" group. */
    private const SUPPLEMENT_DISHES = [
        'Burger maison',
        'Poulet grillé',
        'Saumon grillé',
        'Risotto aux champignons',
        'Pizza margherita',
        'Couscous au poulet',
        'Steak-frites',
        'Fish and chips',
        'Pâtes bolognaise',
        'Curry de poulet',
        'Grillade mixte',
        'Club sandwich',
    ];

    /** @var array<string, array{fr: string, en: string, ar: string, delta: float}> */
    private const COOK = [
        'rare' => ['fr' => 'Saignant', 'en' => 'Rare', 'ar' => 'نيء', 'delta' => 0.00],
        'medium' => ['fr' => 'À point', 'en' => 'Medium', 'ar' => 'متوسط', 'delta' => 0.00],
        'welldone' => ['fr' => 'Bien cuit', 'en' => 'Well done', 'ar' => 'ناضج', 'delta' => 0.00],
    ];

    /** @var array<string, array{fr: string, en: string, ar: string, delta: float}> */
    private const SUPPLEMENTS = [
        'no onions' => ['fr' => 'Sans oignons', 'en' => 'No onions', 'ar' => 'بدون بصل', 'delta' => 0.00],
        'extra sauce' => ['fr' => 'Sauce supplémentaire', 'en' => 'Extra sauce', 'ar' => 'صلصة إضافية', 'delta' => 1.50],
        'spicy' => ['fr' => 'Piment fort', 'en' => 'Extra spicy', 'ar' => 'حار', 'delta' => 0.00],
    ];

    public function run(): void
    {
        $byName = Product::pluck('id', 'name_fr');

        foreach (self::COOK_DISHES as $name) {
            $product = isset($byName[$name]) ? Product::find($byName[$name]) : null;

            if ($product) {
                $this->syncGroup($product, 'Cuisson', 'Cooking', 'الطريقة', 'single', true, 0, self::COOK);
            }
        }

        foreach (self::SUPPLEMENT_DISHES as $name) {
            $product = isset($byName[$name]) ? Product::find($byName[$name]) : null;

            if ($product) {
                $this->syncGroup($product, 'Suppléments', 'Extras', 'إضافات', 'multi', false, 1, self::SUPPLEMENTS);
            }
        }
    }

    /**
     * Create (or update) one option group with its values on a dish.
     *
     * @param  array<string, array{fr: string, en: string, ar: string, delta: float}>  $options
     */
    private function syncGroup(
        Product $dish,
        string $nameFr,
        string $nameEn,
        string $nameAr,
        string $selection,
        bool $required,
        int $position,
        array $options,
    ): void {
        $group = $dish->optionGroups()->firstOrCreate(
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
