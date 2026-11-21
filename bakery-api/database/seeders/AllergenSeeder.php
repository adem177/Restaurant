<?php

namespace Database\Seeders;

use App\Models\Allergen;
use Illuminate\Database\Seeder;

/**
 * Reference list of the 14 EU-regulated allergens.
 * Idempotent: safe to run on an already-seeded database.
 */
class AllergenSeeder extends Seeder
{
    /** @var array<string, array{fr: string, en: string, ar: string}> */
    private const ALLERGENS = [
        'gluten' => ['fr' => 'Gluten', 'en' => 'Gluten', 'ar' => 'الغلوتين'],
        'crustaceans' => ['fr' => 'Crustacés', 'en' => 'Crustaceans', 'ar' => 'ال crustaceans'],
        'eggs' => ['fr' => 'Œufs', 'en' => 'Eggs', 'ar' => 'البيض'],
        'fish' => ['fr' => 'Poissons', 'en' => 'Fish', 'ar' => 'الأسماك'],
        'peanuts' => ['fr' => 'Arachides', 'en' => 'Peanuts', 'ar' => 'الفول السوداني'],
        'soy' => ['fr' => 'Soja', 'en' => 'Soy', 'ar' => 'الصويا'],
        'milk' => ['fr' => 'Lait', 'en' => 'Milk', 'ar' => 'الحليب'],
        'nuts' => ['fr' => 'Fruits à coque', 'en' => 'Tree nuts', 'ar' => 'المكسرات'],
        'celery' => ['fr' => 'Céleri', 'en' => 'Celery', 'ar' => 'الكرفس'],
        'mustard' => ['fr' => 'Moutarde', 'en' => 'Mustard', 'ar' => 'الخردل'],
        'sesame' => ['fr' => 'Sésame', 'en' => 'Sesame', 'ar' => 'السمسم'],
        'sulphites' => ['fr' => 'Sulfites', 'en' => 'Sulphites', 'ar' => 'الكبريتات'],
        'lupin' => ['fr' => 'Lupin', 'en' => 'Lupin', 'ar' => 'الترمس'],
        'molluscs' => ['fr' => 'Mollusques', 'en' => 'Molluscs', 'ar' => 'الرخويات'],
    ];

    public function run(): void
    {
        foreach (self::ALLERGENS as $code => $names) {
            Allergen::firstOrCreate(
                ['code' => $code],
                [
                    'name_fr' => $names['fr'],
                    'name_en' => $names['en'],
                    'name_ar' => $names['ar'],
                ],
            );
        }
    }
}
