<?php

namespace Database\Seeders;

use App\Models\Product;
use Illuminate\Database\Seeder;

/**
 * Assign realistic stock levels so the sold-out / low-stock states are visible.
 * Idempotent: safe to run on an already-seeded database.
 */
class StockSeeder extends Seeder
{
    /** Products left with unlimited stock (NULL) — made to order, never runs out. */
    private const UNLIMITED = [
        'Soupe du jour',
        'Salade de fruits',
        'Expresso',
    ];

    /** Products deliberately set to 0 to demo the sold-out state. */
    private const SOLD_OUT = [
        'Calamars frits',
        'Saumon grillé',
        'Café glacé',
    ];

    /** Everything else gets this many units. */
    private const DEFAULT_STOCK = 15;

    /** Coffee drinks are made to order, so keep a lower count. */
    private const COFFEE_STOCK = 25;

    /** @var array<string, int> */
    private const CUSTOM = [
        'Tiramisu' => 2,      // low stock
        'Cheesecake' => 4,    // low stock
        'Panna cotta' => 3,   // low stock
    ];

    public function run(): void
    {
        Product::query()->with('category')->orderBy('id')->chunkById(100, function ($products) {
            foreach ($products as $product) {
                $product->update(['stock' => $this->stockFor($product)]);
            }
        });
    }

    private function stockFor(Product $product): ?int
    {
        if (in_array($product->name_fr, self::UNLIMITED, true)) {
            return null;
        }

        if (in_array($product->name_fr, self::SOLD_OUT, true)) {
            return 0;
        }

        if (isset(self::CUSTOM[$product->name_fr])) {
            return self::CUSTOM[$product->name_fr];
        }

        return $product->category?->slug === 'coffee'
            ? self::COFFEE_STOCK
            : self::DEFAULT_STOCK;
    }
}
