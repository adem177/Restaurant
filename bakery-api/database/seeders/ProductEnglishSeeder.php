<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Seeder;

/**
 * Fills the English (name_en / description_en) columns by matching on the
 * French name, so it can run safely on an already-seeded database.
 */
class ProductEnglishSeeder extends Seeder
{
    /**
     * French name => English name, for every seeded category.
     *
     * @var array<string, string>
     */
    private const CATEGORIES = [
        'Entrées' => 'Starters',
        'Plats' => 'Mains',
        'Desserts' => 'Desserts',
    ];

    /**
     * French name => English name, for every seeded product.
     *
     * @var array<string, string>
     */
    private const PRODUCTS = [
        'Salade César' => 'Caesar salad',
        'Soupe du jour' => 'Soup of the day',
        'Bruschetta tomates' => 'Tomato bruschetta',
        'Calamars frits' => 'Fried calamari',
        'Assiette de mezze' => 'Mezze platter',
        'Burger maison' => 'Homemade burger',
        'Poulet grillé' => 'Grilled chicken',
        'Saumon grillé' => 'Grilled salmon',
        'Risotto aux champignons' => 'Mushroom risotto',
        'Pizza margherita' => 'Margherita pizza',
        'Couscous au poulet' => 'Chicken couscous',
        'Steak-frites' => 'Steak frites',
        'Fish and chips' => 'Fish and chips',
        'Pâtes bolognaise' => 'Spaghetti bolognese',
        'Curry de poulet' => 'Chicken curry',
        'Grillade mixte' => 'Mixed grill',
        'Club sandwich' => 'Club sandwich',
        'Tiramisu' => 'Tiramisu',
        'Panna cotta' => 'Panna cotta',
        'Salade de fruits' => 'Fruit salad',
        'Fondant au chocolat' => 'Chocolate lava cake',
        'Cheesecake' => 'Cheesecake',
        'Mousse au chocolat' => 'Chocolate mousse',
        'Crème brûlée' => 'Crème brûlée',
        'Brownie' => 'Brownie',
        'Glace vanille' => 'Vanilla ice cream',
        'Cookies' => 'Cookies',
        'Pudding' => 'Pudding',
    ];

    private const DESCRIPTION_EN = 'A dish cooked to order with fresh produce, to enjoy in the restaurant or to go.';

    public function run(): void
    {
        foreach (self::CATEGORIES as $frenchName => $englishName) {
            Category::where('name_fr', $frenchName)
                ->whereNull('name_en')
                ->update(['name_en' => $englishName]);
        }

        foreach (self::PRODUCTS as $frenchName => $englishName) {
            Product::where('name_fr', $frenchName)
                ->whereNull('name_en')
                ->update(['name_en' => $englishName, 'description_en' => self::DESCRIPTION_EN]);
        }
    }
}
