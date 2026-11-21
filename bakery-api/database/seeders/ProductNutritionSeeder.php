<?php

namespace Database\Seeders;

use App\Models\Allergen;
use App\Models\Product;
use Illuminate\Database\Seeder;

/**
 * Assigns allergens (by code) and per-portion nutrition to the seeded
 * products, matching on the French name so it can run on an existing DB.
 */
class ProductNutritionSeeder extends Seeder
{
    /**
     * French product name => ['allergens' => [codes], 'kcal' => int,
     *                          'carbs' => float, 'fat' => float, 'protein' => float]
     *
     * @var array<string, array<string, mixed>>
     */
    private const PRODUCTS = [
        // Entrées
        'Salade César' => ['allergens' => ['gluten', 'eggs', 'milk', 'fish'], 'kcal' => 320, 'carbs' => 12.0, 'fat' => 26.0, 'protein' => 15.0],
        'Soupe du jour' => ['allergens' => ['gluten', 'milk', 'celery'], 'kcal' => 190, 'carbs' => 20.0, 'fat' => 11.0, 'protein' => 4.0],
        'Bruschetta tomates' => ['allergens' => ['gluten'], 'kcal' => 210, 'carbs' => 30.0, 'fat' => 7.0, 'protein' => 6.0],
        'Calamars frits' => ['allergens' => ['molluscs', 'gluten', 'eggs'], 'kcal' => 320, 'carbs' => 24.0, 'fat' => 18.0, 'protein' => 16.0],
        'Assiette de mezze' => ['allergens' => ['sesame', 'milk', 'gluten'], 'kcal' => 380, 'carbs' => 34.0, 'fat' => 20.0, 'protein' => 12.0],

        // Plats
        'Burger maison' => ['allergens' => ['gluten', 'eggs', 'sesame'], 'kcal' => 650, 'carbs' => 42.0, 'fat' => 38.0, 'protein' => 34.0],
        'Poulet grillé' => ['allergens' => ['mustard'], 'kcal' => 420, 'carbs' => 4.0, 'fat' => 22.0, 'protein' => 48.0],
        'Saumon grillé' => ['allergens' => ['fish'], 'kcal' => 480, 'carbs' => 2.0, 'fat' => 30.0, 'protein' => 45.0],
        'Risotto aux champignons' => ['allergens' => ['milk'], 'kcal' => 450, 'carbs' => 52.0, 'fat' => 18.0, 'protein' => 14.0],
        'Pizza margherita' => ['allergens' => ['gluten', 'milk'], 'kcal' => 520, 'carbs' => 58.0, 'fat' => 22.0, 'protein' => 22.0],
        'Couscous au poulet' => ['allergens' => ['gluten'], 'kcal' => 580, 'carbs' => 62.0, 'fat' => 20.0, 'protein' => 32.0],
        'Steak-frites' => ['allergens' => [], 'kcal' => 720, 'carbs' => 44.0, 'fat' => 44.0, 'protein' => 40.0],
        'Fish and chips' => ['allergens' => ['fish', 'gluten'], 'kcal' => 620, 'carbs' => 52.0, 'fat' => 34.0, 'protein' => 30.0],
        'Pâtes bolognaise' => ['allergens' => ['gluten'], 'kcal' => 560, 'carbs' => 68.0, 'fat' => 20.0, 'protein' => 26.0],
        'Curry de poulet' => ['allergens' => [], 'kcal' => 520, 'carbs' => 30.0, 'fat' => 28.0, 'protein' => 32.0],
        'Grillade mixte' => ['allergens' => [], 'kcal' => 780, 'carbs' => 8.0, 'fat' => 52.0, 'protein' => 68.0],
        'Club sandwich' => ['allergens' => ['gluten', 'eggs', 'milk'], 'kcal' => 550, 'carbs' => 44.0, 'fat' => 28.0, 'protein' => 28.0],

        // Desserts
        'Tiramisu' => ['allergens' => ['gluten', 'eggs', 'milk'], 'kcal' => 420, 'carbs' => 38.0, 'fat' => 24.0, 'protein' => 9.0],
        'Panna cotta' => ['allergens' => ['milk'], 'kcal' => 320, 'carbs' => 28.0, 'fat' => 20.0, 'protein' => 5.0],
        'Salade de fruits' => ['allergens' => [], 'kcal' => 120, 'carbs' => 28.0, 'fat' => 1.0, 'protein' => 2.0],
        'Fondant au chocolat' => ['allergens' => ['gluten', 'eggs', 'milk', 'soy'], 'kcal' => 450, 'carbs' => 42.0, 'fat' => 28.0, 'protein' => 7.0],
        'Cheesecake' => ['allergens' => ['gluten', 'eggs', 'milk'], 'kcal' => 480, 'carbs' => 40.0, 'fat' => 30.0, 'protein' => 9.0],
        'Mousse au chocolat' => ['allergens' => ['eggs', 'milk', 'soy'], 'kcal' => 320, 'carbs' => 30.0, 'fat' => 22.0, 'protein' => 6.0],
        'Crème brûlée' => ['allergens' => ['eggs', 'milk'], 'kcal' => 340, 'carbs' => 30.0, 'fat' => 22.0, 'protein' => 6.0],
        'Brownie' => ['allergens' => ['gluten', 'eggs', 'milk', 'soy'], 'kcal' => 400, 'carbs' => 44.0, 'fat' => 24.0, 'protein' => 5.0],
        'Glace vanille' => ['allergens' => ['milk', 'eggs'], 'kcal' => 270, 'carbs' => 30.0, 'fat' => 15.0, 'protein' => 5.0],
        'Cookies' => ['allergens' => ['gluten', 'eggs', 'milk', 'soy'], 'kcal' => 380, 'carbs' => 48.0, 'fat' => 18.0, 'protein' => 5.0],
        'Pudding' => ['allergens' => ['milk', 'eggs'], 'kcal' => 310, 'carbs' => 42.0, 'fat' => 12.0, 'protein' => 6.0],

        // Coffee drinks.
        'Expresso' => ['allergens' => [], 'kcal' => 3, 'carbs' => 0.5, 'fat' => 0.1, 'protein' => 0.2],
        'Café crème' => ['allergens' => ['milk'], 'kcal' => 92, 'carbs' => 7.0, 'fat' => 5.0, 'protein' => 4.2],
        'Cappuccino' => ['allergens' => ['milk'], 'kcal' => 118, 'carbs' => 9.5, 'fat' => 5.5, 'protein' => 6.0],
        'Latte' => ['allergens' => ['milk'], 'kcal' => 134, 'carbs' => 11.0, 'fat' => 5.8, 'protein' => 7.1],
        'Moka' => ['allergens' => ['milk', 'soy'], 'kcal' => 178, 'carbs' => 18.0, 'fat' => 8.4, 'protein' => 6.8],
        'Café glacé' => ['allergens' => ['milk'], 'kcal' => 106, 'carbs' => 12.0, 'fat' => 4.2, 'protein' => 4.0],

        // Juices and gazouz (soft drinks).
        'Jus d’orange' => ['allergens' => [], 'kcal' => 110, 'carbs' => 26.0, 'fat' => 0.4, 'protein' => 1.7],
        'Jus de pomme' => ['allergens' => [], 'kcal' => 115, 'carbs' => 28.0, 'fat' => 0.3, 'protein' => 0.3],
        'Jus d’ananas' => ['allergens' => [], 'kcal' => 130, 'carbs' => 32.0, 'fat' => 0.3, 'protein' => 0.9],
        'Limonade fraîche' => ['allergens' => [], 'kcal' => 120, 'carbs' => 30.0, 'fat' => 0.0, 'protein' => 0.2],
        'Gazouz citron' => ['allergens' => [], 'kcal' => 130, 'carbs' => 33.0, 'fat' => 0.0, 'protein' => 0.0],
        'Eau gazeuse' => ['allergens' => [], 'kcal' => 0, 'carbs' => 0.0, 'fat' => 0.0, 'protein' => 0.0],
    ];

    public function run(): void
    {
        $allergens = Allergen::pluck('id', 'code');

        Product::query()->whereHas('category')->with('allergens')->chunkById(100, function ($products) use ($allergens) {
            foreach ($products as $product) {
                $data = self::PRODUCTS[$product->name_fr] ?? null;

                if ($data === null) {
                    continue;
                }

                $ids = collect($data['allergens'])
                    ->map(fn (string $code) => $allergens[$code] ?? null)
                    ->filter()
                    ->all();

                // Replace the current set so re-running stays consistent.
                $product->allergens()->sync($ids);

                $product->update([
                    'calories' => $data['kcal'],
                    'carbs_g' => $data['carbs'],
                    'fat_g' => $data['fat'],
                    'protein_g' => $data['protein'],
                ]);
            }
        });
    }
}
