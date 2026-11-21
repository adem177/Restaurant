<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Seeder;

/**
 * Adds a "Boissons" (Drinks) category with a small drinks menu.
 * Idempotent: safe to run on an already-seeded database.
 */
class CoffeeSeeder extends Seeder
{
    private const HOT_DESC = [
        'fr' => 'Café fraîchement préparé avec nos grains torréfiés, servi chaud.',
        'en' => 'Freshly brewed coffee with our roasted beans, served hot.',
        'ar' => 'قهوة محضرة طازجة بحبوبنا المحمصة، تُقدّم ساخنة.',
    ];

    private const MILK_DESC = [
        'fr' => 'Café espresso onctueux avec lait mousseux, préparé à la demande.',
        'en' => 'Creamy espresso with frothed milk, made to order.',
        'ar' => 'إسبريسو كريمي مع الحليب المخفوق، يُحضّر عند الطلب.',
    ];

    private const ICED_DESC = [
        'fr' => 'Café espresso glacé rafraîchissant, servi sur glaçons.',
        'en' => 'Refreshing iced espresso, served over ice.',
        'ar' => 'إسبريسو مثلج منعش، يُقدّم على الثلج.',
    ];

    private const JUICE_DESC = [
        'fr' => 'Jus de fruits fraîchement pressés, servis glacés.',
        'en' => 'Freshly pressed fruit juices, served chilled.',
        'ar' => 'عصير فواكه طازج العصر، يُقدَّم باردًا.',
    ];

    private const LEMONADE_DESC = [
        'fr' => 'Limonade maison acidulée à base de citrons frais.',
        'en' => 'Zesty homemade lemonade made with fresh lemons.',
        'ar' => 'ليموناضة منزلية منعشة من الليمون الطازج.',
    ];

    private const SODA_DESC = [
        'fr' => 'Boisson gazeuse rafraîchissante, servie fraîche.',
        'en' => 'Refreshing carbonated soft drink, served chilled.',
        'ar' => 'مشروب غازي منعش، يُقدَّم باردًا.',
    ];

    /** @var array<int, array<string, mixed>> */
    private const PRODUCTS = [
        [
            'name_fr' => 'Expresso',
            'name_en' => 'Espresso',
            'name_ar' => 'إسبريسو',
            'price' => 2.50,
            'desc' => 'HOT_DESC',
            'photo' => 'photo-1510591509098-f4fdc6d0ff04',
        ],
        [
            'name_fr' => 'Café crème',
            'name_en' => 'Milk coffee',
            'name_ar' => 'قهوة بالحليب',
            'price' => 3.50,
            'desc' => 'MILK_DESC',
            'photo' => 'photo-1509042239860-f550ce710b93',
        ],
        [
            'name_fr' => 'Cappuccino',
            'name_en' => 'Cappuccino',
            'name_ar' => 'كابتشينو',
            'price' => 4.50,
            'desc' => 'MILK_DESC',
            'photo' => 'photo-1572442388796-11668a67e53d',
        ],
        [
            'name_fr' => 'Latte',
            'name_en' => 'Latte',
            'name_ar' => 'لاتيه',
            'price' => 4.50,
            'desc' => 'MILK_DESC',
            'photo' => 'photo-1541167760496-1628856ab772',
        ],
        [
            'name_fr' => 'Moka',
            'name_en' => 'Mocha',
            'name_ar' => 'موكا',
            'price' => 5.00,
            'desc' => 'MILK_DESC',
            'photo' => 'photo-1578374173705-969cbe6f2d6b',
        ],
        [
            'name_fr' => 'Café glacé',
            'name_en' => 'Iced coffee',
            'name_ar' => 'قهوة مثلجة',
            'price' => 5.50,
            'desc' => 'ICED_DESC',
            'photo' => 'photo-1461023058943-07fcbe16d735',
        ],

        // Jus frais.
        [
            'name_fr' => 'Jus d’orange',
            'name_en' => 'Orange juice',
            'name_ar' => 'عصير البرتقال',
            'price' => 6.00,
            'desc' => 'JUICE_DESC',
            'photo' => 'photo-1600271886742-f049cd451bba',
        ],
        [
            'name_fr' => 'Jus de pomme',
            'name_en' => 'Apple juice',
            'name_ar' => 'عصير التفاح',
            'price' => 6.00,
            'desc' => 'JUICE_DESC',
            'photo' => 'photo-1600271772470-bd22a42787b3',
        ],
        [
            'name_fr' => 'Jus d’ananas',
            'name_en' => 'Pineapple juice',
            'name_ar' => 'عصير الأناناس',
            'price' => 6.50,
            'desc' => 'JUICE_DESC',
            'photo' => 'photo-1587049352846-4a222e784d38',
        ],
        [
            'name_fr' => 'Limonade fraîche',
            'name_en' => 'Fresh lemonade',
            'name_ar' => 'ليموناضة طازجة',
            'price' => 5.50,
            'desc' => 'LEMONADE_DESC',
            'photo' => 'photo-1621263764928-df1444c5e859',
        ],

        // Gazouz (sodas).
        [
            'name_fr' => 'Gazouz citron',
            'name_en' => 'Lemon soda',
            'name_ar' => 'غازوز ليمون',
            'price' => 4.50,
            'desc' => 'SODA_DESC',
            'photo' => 'photo-1613478223719-2ab802602423',
        ],
        [
            'name_fr' => 'Eau gazeuse',
            'name_en' => 'Sparkling water',
            'name_ar' => 'ماء غازي',
            'price' => 3.00,
            'desc' => 'SODA_DESC',
            'photo' => 'photo-1523362628745-0c100150b504',
        ],
    ];

    public function run(): void
    {
        $category = Category::firstOrCreate(
            ['slug' => 'coffee'],
            ['name_fr' => 'Boissons', 'name_en' => 'Drinks', 'name_ar' => 'مشروبات'],
        );

        foreach (self::PRODUCTS as $product) {
            $desc = constant(self::class.'::'.$product['desc']);

            Product::firstOrCreate(
                ['category_id' => $category->id, 'name_fr' => $product['name_fr']],
                [
                    'name_en' => $product['name_en'],
                    'name_ar' => $product['name_ar'],
                    'description_fr' => $desc['fr'],
                    'description_en' => $desc['en'],
                    'description_ar' => $desc['ar'],
                    'price' => $product['price'],
                    'image' => $this->url($product['photo']),
                    // Drinks are both vegetarian and gluten-free.
                    'is_vegetarian' => true,
                    'is_gluten_free' => true,
                    'is_featured' => false,
                ],
            );
        }
    }

    private function url(string $photoId): string
    {
        return "https://images.unsplash.com/{$photoId}?w=600&q=80&auto=format&fit=crop";
    }
}
