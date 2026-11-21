<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Seeder;

/**
 * Adds a "Formules" (fixed-price set menus) category. Each formule is a single
 * product whose required option groups let the customer pick one dish per
 * course (entrée / plat / dessert). The chosen dishes are snapshotted onto the
 * order line like any other option, so the whole cart / checkout pipeline is
 * reused unchanged.
 * Idempotent: safe to run on an already-seeded database.
 */
class FormuleSeeder extends Seeder
{
    /** @var array<string, array{fr: string, en: string, ar: string}> */
    private const DESCRIPTIONS = [
        'lunch' => [
            'fr' => 'Formule déjeuner : un plat + un dessert au choix, servie en semaine.',
            'en' => 'Lunch set menu: a main + a dessert of your choice, served on weekdays.',
            'ar' => 'قائمة الغداء: طبق وحلوى من اختيارك، تُقدَّم في أيام الأسبوع.',
        ],
        'express' => [
            'fr' => 'Formule express : une entrée + un plat + un dessert au choix.',
            'en' => 'Express set menu: a starter + a main + a dessert of your choice.',
            'ar' => 'القائمة السريعة: مقبلات وطبق وحلوى من اختيارك.',
        ],
    ];

    /**
     * Each formule defines its price, photo and courses. A course maps a
     * trilingual label to the dishes it offers (matched by French name) with an
     * optional price supplement for the premium dishes.
     *
     * @var array<int, array<string, mixed>>
     */
    private const FORMULES = [
        [
            'key' => 'lunch',
            'name_fr' => 'Formule déjeuner',
            'name_en' => 'Lunch set menu',
            'name_ar' => 'قائمة الغداء',
            'price' => 29.00,
            'photo' => 'photo-1546069901-ba9599a7e63c',
            'courses' => [
                [
                    'label' => ['fr' => 'Plat au choix', 'en' => 'Main course', 'ar' => 'الطبق'],
                    'dishes' => [
                        'Burger maison' => 0,
                        'Poulet grillé' => 0,
                        'Pâtes bolognaise' => 0,
                        'Pizza margherita' => 0,
                        'Risotto aux champignons' => 0,
                    ],
                ],
                [
                    'label' => ['fr' => 'Dessert au choix', 'en' => 'Dessert', 'ar' => 'الحلوى'],
                    'dishes' => [
                        'Tiramisu' => 0,
                        'Panna cotta' => 0,
                        'Mousse au chocolat' => 0,
                        'Glace vanille' => 0,
                    ],
                ],
            ],
        ],
        [
            'key' => 'express',
            'name_fr' => 'Formule express',
            'name_en' => 'Express set menu',
            'name_ar' => 'القائمة السريعة',
            'price' => 32.00,
            'photo' => 'photo-1414235077428-338989a2e8c0',
            'courses' => [
                [
                    'label' => ['fr' => 'Entrée au choix', 'en' => 'Starter', 'ar' => 'المقبلات'],
                    'dishes' => [
                        'Bruschetta tomates' => 0,
                        'Salade César' => 0,
                        'Assiette de mezze' => 0,
                        'Soupe du jour' => 0,
                    ],
                ],
                [
                    'label' => ['fr' => 'Plat au choix', 'en' => 'Main course', 'ar' => 'الطبق'],
                    'dishes' => [
                        'Burger maison' => 0,
                        'Poulet grillé' => 0,
                        'Couscous au poulet' => 2,
                        'Steak-frites' => 4,
                        'Saumon grillé' => 6,
                    ],
                ],
                [
                    'label' => ['fr' => 'Dessert au choix', 'en' => 'Dessert', 'ar' => 'الحلوى'],
                    'dishes' => [
                        'Tiramisu' => 0,
                        'Fondant au chocolat' => 2,
                        'Cheesecake' => 0,
                        'Crème brûlée' => 0,
                    ],
                ],
            ],
        ],
    ];

    public function run(): void
    {
        $category = Category::firstOrCreate(
            ['slug' => 'formules'],
            ['name_fr' => 'Formules', 'name_en' => 'Menus', 'name_ar' => 'قوائم'],
        );

        // Dishes live in every other category; key them by French name so the
        // formule courses can reuse their exact trilingual labels.
        $dishes = Product::where('category_id', '!=', $category->id)
            ->get()
            ->keyBy('name_fr');

        foreach (self::FORMULES as $formule) {
            $desc = self::DESCRIPTIONS[$formule['key']];

            $product = Product::firstOrCreate(
                ['category_id' => $category->id, 'name_fr' => $formule['name_fr']],
                [
                    'name_en' => $formule['name_en'],
                    'name_ar' => $formule['name_ar'],
                    'description_fr' => $desc['fr'],
                    'description_en' => $desc['en'],
                    'description_ar' => $desc['ar'],
                    'price' => $formule['price'],
                    'image' => $this->url($formule['photo']),
                    // A formule is a mix of dishes, so it is neither
                    // vegetarian nor gluten-free by default.
                    'is_vegetarian' => false,
                    'is_gluten_free' => false,
                    'is_featured' => true,
                ],
            );

            foreach ($formule['courses'] as $position => $course) {
                $this->syncCourse($product, $course, $position, $dishes);
            }
        }
    }

    /**
     * Create (or update) one required single-choice course group on a formule.
     *
     * @param  array{label: array{fr: string, en: string, ar: string}, dishes: array<string, float>}  $course
     * @param  Collection<int, Product>  $dishes
     */
    private function syncCourse(Product $formule, array $course, int $position, Collection $dishes): void
    {
        $label = $course['label'];

        $group = $formule->optionGroups()->firstOrCreate(
            ['name_fr' => $label['fr']],
            [
                'name_en' => $label['en'],
                'name_ar' => $label['ar'],
                'selection' => 'single',
                'is_required' => true,
                'position' => $position,
            ],
        );

        $index = 0;

        foreach ($course['dishes'] as $dishName => $delta) {
            $dish = $dishes->get($dishName);

            if (! $dish) {
                // The dish was not seeded — skip rather than break the formule.
                continue;
            }

            $group->values()->firstOrCreate(
                ['name_fr' => $dish->name_fr],
                [
                    'name_en' => $dish->name_en,
                    'name_ar' => $dish->name_ar,
                    'price_delta' => $delta,
                    'position' => $index,
                ],
            );

            $index++;
        }
    }

    private function url(string $photoId): string
    {
        return "https://images.unsplash.com/{$photoId}?w=600&q=80&auto=format&fit=crop";
    }
}
