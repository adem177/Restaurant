<?php

namespace Database\Seeders;

use App\Models\Promo;
use Illuminate\Database\Seeder;

class PromoSeeder extends Seeder
{
    public function run(): void
    {
        Promo::firstOrCreate(
            ['code' => 'BIENVENUE10'],
            [
                'type' => 'percent',
                'value' => 10,
                'min_total' => 20,
                'max_uses' => 100,
                'is_active' => true,
            ],
        );

        Promo::firstOrCreate(
            ['code' => 'FIDELITE5'],
            [
                'type' => 'fixed',
                'value' => 5,
                'min_total' => 30,
                'is_active' => true,
            ],
        );
    }
}
