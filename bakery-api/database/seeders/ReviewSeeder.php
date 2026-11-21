<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\Review;
use Illuminate\Database\Seeder;

class ReviewSeeder extends Seeder
{
    /**
     * Seed approved client reviews on real products so the home page
     * testimonial section has content (one review per client per product).
     */
    public function run(): void
    {
        if (Review::query()->exists()) {
            return;
        }

        $comments = [
            'Excellent, les plats sont frais et le service impeccable.',
            'Très bon rapport qualité-prix, je recommande.',
            'Livraison rapide et plats encore chauds, parfait.',
            'Une ambiance chaleureuse et une cuisine pleine de saveurs.',
            'Le meilleur burger de la ville, sans conteste.',
            'Desserts délicieux, on y retournera sans hésiter.',
            'Commande passée en ligne sans aucune difficulté.',
            'Des portions généreuses et des produits vraiment frais.',
            'Service adorable, on se sent comme à la maison.',
            'Toujours une excellente expérience, même après plusieurs visites.',
            'Le menu change souvent, c\u2019est agréable pour varier.',
            'Parfait pour un déjeuner rapide au bureau.',
        ];

        // Prefer featured products first: the home testimonial strip reads
        // reviews from the featured dishes, then fill up with random ones.
        $products = Product::query()
            ->orderByDesc('is_featured')
            ->inRandomOrder()
            ->take(count($comments))
            ->get();

        foreach ($products as $i => $product) {
            Review::factory()->create([
                'product_id' => $product->id,
                'rating' => rand(4, 5),
                'comment' => $comments[$i],
                'status' => 'approved',
            ]);
        }
    }
}
