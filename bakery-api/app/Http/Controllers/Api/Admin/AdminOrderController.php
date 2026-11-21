<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Models\LoyaltyTransaction;
use App\Models\Order;
use App\Notifications\OrderStatusNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Notification;

class AdminOrderController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Order::with('items.product', 'items.options');

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        if ($request->filled('type')) {
            $query->where('type', $request->string('type'));
        }

        return OrderResource::collection(
            $query->latest('id')->paginate(15)
        );
    }

    public function show(Order $order): JsonResponse
    {
        return (new OrderResource($order->load('items.product', 'items.options')))->response();
    }

    /**
     * Update the order status (pending → confirmed → ready → completed).
     * Sends the client a status email in their account language.
     */
    public function updateStatus(Request $request, Order $order): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'in:pending,confirmed,ready,completed,cancelled'],
        ]);

        $order->update($validated);

        if ($order->wasChanged('status')) {
            if ($order->status === 'cancelled') {
                $this->returnStock($order);
            }
            if ($order->status === 'completed') {
                $this->creditLoyaltyPoints($order);
            }
            $this->notifyStatusChange($order);
        }

        return (new OrderResource($order->load('items.product', 'items.options')))->response();
    }

    /**
     * Give reserved stock back when an order is cancelled (only once).
     */
    private function returnStock(Order $order): void
    {
        if ($order->stock_returned) {
            return;
        }

        foreach ($order->items()->with('product')->get() as $item) {
            $product = $item->product;

            if ($product && $product->stock !== null) {
                $product->increment('stock', $item->quantity);
            }
        }

        $order->forceFill(['stock_returned' => true])->save();
    }

    /**
     * Credit loyalty points once, when a linked account's order is completed.
     * 1 point per 1 DT paid, based on the final (post-discount) total.
     */
    private function creditLoyaltyPoints(Order $order): void
    {
        if (! $order->user || $order->points_earned > 0) {
            return;
        }

        $points = (int) round((float) $order->total);

        if ($points <= 0) {
            return;
        }

        $user = $order->user;
        $user->loyalty_points = $user->loyalty_points + $points;
        $user->save();

        $order->points_earned = $points;
        $order->save();

        LoyaltyTransaction::create([
            'user_id' => $user->id,
            'order_id' => $order->id,
            'points' => $points,
            'type' => 'earned',
            'description' => "Earned for order #{$order->id}",
        ]);
    }

    /**
     * Email the linked account (preferred, carries the locale) or the
     * guest customer address when the order has no account.
     */
    private function notifyStatusChange(Order $order): void
    {
        if ($order->user) {
            $order->user->notify(new OrderStatusNotification($order));

            return;
        }

        if ($order->customer_email) {
            Notification::route('mail', $order->customer_email)
                ->notify(new OrderStatusNotification($order));
        }
    }
}
