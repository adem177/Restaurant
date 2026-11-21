<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        User::create([
            'name' => 'Admin',
            'email' => 'admin@happyplate.com',
            'password' => Hash::make('password'),
            'role' => 'admin',
        ]);

        User::create([
            'name' => 'Employé',
            'email' => 'employe@happyplate.com',
            'password' => Hash::make('password'),
            'role' => 'employee',
        ]);

        $categories = [
            ['name_fr' => 'Entrées', 'name_ar' => 'مقبلات', 'slug' => 'starters'],
            ['name_fr' => 'Plats', 'name_ar' => 'أطباق', 'slug' => 'mains'],
            ['name_fr' => 'Desserts', 'name_ar' => 'حلويات', 'slug' => 'desserts'],
        ];

        foreach ($categories as $category) {
            Category::create($category);
        }

        $products = [
            // Entrées
            ['category' => 'starters', 'name_fr' => 'Salade César', 'name_ar' => 'سلطة سيزر', 'price' => 13.00, 'image' => 'caesar-salad.jpg'],
            ['category' => 'starters', 'name_fr' => 'Soupe du jour', 'name_ar' => 'شوربة اليوم', 'price' => 9.00, 'is_vegetarian' => true, 'is_gluten_free' => true, 'image' => 'soup.jpg'],
            ['category' => 'starters', 'name_fr' => 'Bruschetta tomates', 'name_ar' => 'بروشيتا بالطماطم', 'price' => 11.00, 'is_vegetarian' => true, 'image' => 'bruschetta.jpg'],
            ['category' => 'starters', 'name_fr' => 'Calamars frits', 'name_ar' => 'كالاماري مقلي', 'price' => 18.00, 'image' => 'calamari.jpg'],
            ['category' => 'starters', 'name_fr' => 'Assiette de mezze', 'name_ar' => 'مقبلات مشكلة', 'price' => 16.00, 'is_vegetarian' => true, 'is_gluten_free' => true, 'image' => 'mezze.jpg'],

            // Plats
            ['category' => 'mains', 'name_fr' => 'Burger maison', 'name_ar' => 'برغر بيتي', 'price' => 22.00, 'image' => 'burger.jpg'],
            ['category' => 'mains', 'name_fr' => 'Poulet grillé', 'name_ar' => 'دجاج مشوي', 'price' => 26.00, 'is_gluten_free' => true, 'image' => 'grilled-chicken.jpg'],
            ['category' => 'mains', 'name_fr' => 'Saumon grillé', 'name_ar' => 'سلمون مشوي', 'price' => 32.00, 'is_gluten_free' => true, 'image' => 'grilled-salmon.jpg'],
            ['category' => 'mains', 'name_fr' => 'Risotto aux champignons', 'name_ar' => 'ريزوتو بالفطر', 'price' => 24.00, 'is_vegetarian' => true, 'is_gluten_free' => true, 'image' => 'risotto.jpg'],
            ['category' => 'mains', 'name_fr' => 'Pizza margherita', 'name_ar' => 'بيتزا مارغريتا', 'price' => 19.00, 'is_vegetarian' => true, 'image' => 'pizza.jpg'],
            ['category' => 'mains', 'name_fr' => 'Couscous au poulet', 'name_ar' => 'كسكس بالدجاج', 'price' => 27.00, 'is_featured' => true, 'image' => 'couscous.jpg'],
            ['category' => 'mains', 'name_fr' => 'Steak-frites', 'name_ar' => 'ستيك فريت', 'price' => 30.00, 'is_featured' => true, 'image' => 'steak-frites.jpg'],
            ['category' => 'mains', 'name_fr' => 'Fish and chips', 'name_ar' => 'فش أند شيبس', 'price' => 26.00, 'image' => 'fish-and-chips.jpg'],
            ['category' => 'mains', 'name_fr' => 'Pâtes bolognaise', 'name_ar' => 'معكرونة بولونيز', 'price' => 20.00, 'image' => 'pasta-bolognaise.jpg'],
            ['category' => 'mains', 'name_fr' => 'Curry de poulet', 'name_ar' => 'كاري الدجاج', 'price' => 24.00, 'image' => 'chicken-curry.jpg'],
            ['category' => 'mains', 'name_fr' => 'Grillade mixte', 'name_ar' => 'مشاوي مشكلة', 'price' => 34.00, 'is_featured' => true, 'image' => 'mixed-grill.jpg'],
            ['category' => 'mains', 'name_fr' => 'Club sandwich', 'name_ar' => 'ساندويتش كلوب', 'price' => 18.00, 'image' => 'club-sandwich.jpg'],

            // Desserts
            ['category' => 'desserts', 'name_fr' => 'Tiramisu', 'name_ar' => 'تيراميسو', 'price' => 12.00, 'is_vegetarian' => true, 'image' => 'tiramisu.jpg'],
            ['category' => 'desserts', 'name_fr' => 'Panna cotta', 'name_ar' => 'باناكوتا', 'price' => 10.00, 'is_vegetarian' => true, 'is_gluten_free' => true, 'image' => 'panna-cotta.jpg'],
            ['category' => 'desserts', 'name_fr' => 'Salade de fruits', 'name_ar' => 'سلطة الفواكه', 'price' => 9.00, 'is_vegetarian' => true, 'is_gluten_free' => true, 'image' => 'fruit-salad.jpg'],
            ['category' => 'desserts', 'name_fr' => 'Fondant au chocolat', 'name_ar' => 'كيك الشوكولاتة الساخن', 'price' => 13.00, 'is_vegetarian' => true, 'is_featured' => true, 'image' => 'chocolate-fondant.jpg'],
            ['category' => 'desserts', 'name_fr' => 'Cheesecake', 'name_ar' => 'تشيز كيك', 'price' => 12.00, 'is_vegetarian' => true, 'image' => 'cheesecake.jpg'],
            ['category' => 'desserts', 'name_fr' => 'Mousse au chocolat', 'name_ar' => 'موس الشوكولاتة', 'price' => 10.00, 'is_vegetarian' => true, 'is_gluten_free' => true, 'image' => 'chocolate-mousse.jpg'],
            ['category' => 'desserts', 'name_fr' => 'Crème brûlée', 'name_ar' => 'كرام بروليه', 'price' => 11.00, 'is_vegetarian' => true, 'is_gluten_free' => true, 'image' => 'creme-brulee.jpg'],
            ['category' => 'desserts', 'name_fr' => 'Brownie', 'name_ar' => 'براوني', 'price' => 9.00, 'is_vegetarian' => true, 'image' => 'brownie.jpg'],
            ['category' => 'desserts', 'name_fr' => 'Glace vanille', 'name_ar' => 'آيس كريم فانيلا', 'price' => 7.00, 'is_vegetarian' => true, 'is_gluten_free' => true, 'image' => 'vanilla-ice-cream.jpg'],
            ['category' => 'desserts', 'name_fr' => 'Cookies', 'name_ar' => 'كوكيز', 'price' => 6.00, 'is_vegetarian' => true, 'image' => 'cookies.jpg'],
            ['category' => 'desserts', 'name_fr' => 'Pudding', 'name_ar' => 'بودينغ', 'price' => 9.00, 'is_vegetarian' => true, 'is_gluten_free' => true, 'image' => 'pudding.jpg'],
        ];

        foreach ($products as $product) {
            $category = Category::where('slug', $product['category'])->first();
            Product::create([
                'category_id' => $category->id,
                'name_fr' => $product['name_fr'],
                'name_ar' => $product['name_ar'],
                'description_fr' => 'Un plat préparé à la minute avec des produits frais, à savourer sur place ou à emporter.',
                'description_ar' => 'طبق يُحضَّر عند الطلب بمكوّنات طازجة، يُقدَّم في المطعم أو للتوصيل.',
                'price' => $product['price'],
                'image' => $product['image'] ?? null,
                'is_vegetarian' => $product['is_vegetarian'] ?? false,
                'is_gluten_free' => $product['is_gluten_free'] ?? false,
                'is_featured' => $product['is_featured'] ?? false,
            ]);
        }

        $this->call(ProductImagesSeeder::class);
        $this->call(ProductEnglishSeeder::class);
        $this->call(CoffeeSeeder::class);
        $this->call(PromoSeeder::class);
        $this->call(AllergenSeeder::class);
        $this->call(ProductNutritionSeeder::class);
        $this->call(CoffeeOptionSeeder::class);
        $this->call(DishOptionSeeder::class);
        $this->call(FormuleSeeder::class);
        $this->call(StockSeeder::class);
        $this->call(DemoOrdersSeeder::class);
        $this->call(ReviewSeeder::class);
    }
}
