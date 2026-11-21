<?php

namespace Database\Seeders;

use App\Models\Order;
use App\Models\Product;
use App\Models\Reservation;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class DemoOrdersSeeder extends Seeder
{
    /**
     * Create realistic orders + reservations spread over the last 7 days
     * so the admin dashboard statistics have data to display.
     */
    public function run(): void
    {
        $products = Product::all();
        $statuses = ['completed', 'completed', 'completed', 'confirmed', 'pending'];

        foreach (range(0, 6) as $daysAgo) {
            $day = Carbon::today()->subDays($daysAgo);
            $ordersCount = rand(2, 6);

            foreach (range(1, $ordersCount) as $i) {
                $order = Order::create([
                    'customer_name' => fake()->name(),
                    'customer_phone' => fake()->phoneNumber(),
                    'customer_email' => fake()->safeEmail(),
                    'type' => fake()->randomElement(['pickup', 'delivery']),
                    'address' => fake()->address(),
                    'status' => $daysAgo === 0 ? fake()->randomElement(['pending', 'confirmed']) : 'completed',
                    'total' => 0,
                    'created_at' => $day->copy()->setHour(rand(8, 21))->setMinute(rand(0, 59)),
                ]);

                $total = 0;
                foreach (range(1, rand(1, 4)) as $j) {
                    $product = $products->random();
                    $qty = rand(1, 3);
                    $order->items()->create([
                        'product_id' => $product->id,
                        'quantity' => $qty,
                        'price' => $product->price,
                    ]);
                    $total += $product->price * $qty;
                }

                $order->update(['total' => $total]);
            }

            // Reservations: a few per day
            foreach (range(1, rand(1, 3)) as $i) {
                Reservation::create([
                    'name' => fake()->name(),
                    'phone' => fake()->phoneNumber(),
                    'email' => fake()->safeEmail(),
                    'date' => $day->copy()->addDays(rand(0, 5))->toDateString(),
                    'time' => fake()->randomElement(['12:00', '13:00', '19:00', '19:30', '20:00']),
                    'guests' => rand(2, 8),
                    'status' => fake()->randomElement(['confirmed', 'pending', 'confirmed']),
                ]);
            }
        }
    }
}
