<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use App\Models\Reservation;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;

class StatsController extends Controller
{
    /** Stock level at or below which a product is flagged as "low stock". */
    private const LOW_STOCK_THRESHOLD = 5;

    /**
     * Dashboard overview: revenue, orders, reservations, top products,
     * peak hours and daily revenue for the last 7 days.
     */
    public function index(): JsonResponse
    {
        $today = Carbon::today();

        $overview = [
            'today_revenue' => Order::whereDate('created_at', $today)
                ->where('status', '!=', 'cancelled')
                ->sum('total'),
            'today_orders' => Order::whereDate('created_at', $today)->count(),
            'pending_orders' => Order::where('status', 'pending')->count(),
            'today_reservations' => Reservation::whereDate('date', $today)->count(),
            'upcoming_reservations' => Reservation::where('date', '>=', $today)
                ->where('status', '!=', 'cancelled')
                ->count(),
            'out_of_stock' => Product::whereNotNull('stock')->where('stock', '<=', 0)->count(),
            'low_stock' => Product::whereNotNull('stock')
                ->where('stock', '>', 0)
                ->where('stock', '<=', self::LOW_STOCK_THRESHOLD)
                ->count(),
        ];

        $topProducts = Order::query()
            ->where('status', '!=', 'cancelled')
            ->join('order_items', 'orders.id', '=', 'order_items.order_id')
            ->join('products', 'order_items.product_id', '=', 'products.id')
            ->groupBy('products.id', 'products.name_fr', 'products.name_ar')
            ->selectRaw('products.id, products.name_fr, products.name_ar, SUM(order_items.quantity) as total_sold, SUM(order_items.quantity * order_items.price) as revenue')
            ->orderByDesc('total_sold')
            ->limit(5)
            ->get();

        $peakHours = Order::query()
            ->where('status', '!=', 'cancelled')
            ->selectRaw("strftime('%H', created_at) as hour, COUNT(*) as orders_count")
            ->groupBy('hour')
            ->orderBy('hour')
            ->get();

        $dailyRevenue = Order::query()
            ->where('status', '!=', 'cancelled')
            ->where('created_at', '>=', $today->copy()->subDays(6))
            ->selectRaw('date(created_at) as day, SUM(total) as revenue, COUNT(*) as orders_count')
            ->groupBy('day')
            ->orderBy('day')
            ->get();

        return response()->json([
            'overview' => $overview,
            'top_products' => $topProducts,
            'peak_hours' => $peakHours,
            'daily_revenue' => $dailyRevenue,
        ]);
    }
}
