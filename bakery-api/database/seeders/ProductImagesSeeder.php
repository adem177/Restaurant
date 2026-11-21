<?php

namespace Database\Seeders;

use App\Models\Product;
use Illuminate\Database\Seeder;

class ProductImagesSeeder extends Seeder
{
    /**
     * Real restaurant photos (Unsplash) matched to each product by its French name.
     * Run with: php artisan db:seed --class=ProductImagesSeeder
     */
    public function run(): void
    {
        $images = [
            // Entrées
            'Salade César' => 'photo-1512621776951-a57141f2eefd',
            'Soupe du jour' => 'photo-1547592166-23ac45744acd',
            'Bruschetta tomates' => 'photo-1572695157366-5e585ab2b69f',
            'Calamars frits' => 'photo-1599487488170-d11ec9c172f0',
            'Assiette de mezze' => 'photo-1544025162-d76694265947',

            // Plats
            'Burger maison' => 'photo-1568901346375-23c9450c58cd',
            'Poulet grillé' => 'photo-1532550907401-a500c9a57435',
            'Saumon grillé' => 'photo-1467003909585-2f8a72700288',
            'Risotto aux champignons' => 'photo-1563379926898-05f4575a45d8',
            'Pizza margherita' => 'photo-1574071318508-1cdbab80d002',
            'Couscous au poulet' => 'photo-1585937421612-70a008356fbe',
            'Steak-frites' => 'photo-1600891964092-4316c288032e',
            'Fish and chips' => 'photo-1579208030886-b937da0925dc',
            'Pâtes bolognaise' => 'photo-1621996346565-e3dbc646d9a9',
            'Curry de poulet' => 'photo-1455619452474-d2be8b1e70cd',
            'Grillade mixte' => 'photo-1529193591184-b1d58069ecdd',
            'Club sandwich' => 'photo-1553909489-cd47e0907980',

            // Desserts
            'Tiramisu' => 'photo-1571877227200-a0d98ea607e9',
            'Panna cotta' => 'photo-1464349095431-e9a21285b5f3',
            'Salade de fruits' => 'photo-1490474418585-ba9bad8fd0ea',
            'Fondant au chocolat' => 'photo-1606313564200-e75d5e30476c',
            'Cheesecake' => 'photo-1533134242443-d4fd215305ad',
            'Mousse au chocolat' => 'photo-1541783245831-57d6fb0926d3',
            'Crème brûlée' => 'photo-1470324161839-ce2bb6fa6bc3',
            'Brownie' => 'photo-1564355808539-22fda35bed7e',
            'Glace vanille' => 'photo-1497034825429-c343d7c6a68f',
            'Cookies' => 'photo-1499636136210-6f4ee915583e',
            'Pudding' => 'https://images.pexels.com/photos/36909858/pexels-photo-36909858.jpeg?auto=compress&cs=tinysrgb&w=600',
        ];

        foreach ($images as $nameFr => $photo) {
            Product::where('name_fr', $nameFr)->update([
                'image' => $this->url($photo),
            ]);
        }
    }

    /**
     * Unsplash entries are photo ids; a full URL (other CDN) passes through.
     */
    private function url(string $photo): string
    {
        if (str_starts_with($photo, 'http')) {
            return $photo;
        }

        return "https://images.unsplash.com/{$photo}?w=600&q=80&auto=format&fit=crop";
    }
}
