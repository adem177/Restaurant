<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Models\LoyaltyTransaction;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductOptionValue;
use App\Models\Promo;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OrderController extends Controller
{
    /** Points required for each redemption step (100 pts = 5 DT). */
    private const REDEEM_STEP = 100;

    /** DT value of one redemption step. */
    private const REDEEM_STEP_VALUE = 5.0;

    /** Maximum discount as a fraction of the subtotal when using points. */
    private const POINTS_DISCOUNT_CAP = 0.20;

    /**
     * Create a new order with its items (mock payment: order is created directly).
     * Supports a promo code and/or loyalty-point redemption (mutually exclusive).
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'customer_name' => ['required', 'string', 'max:255'],
            'customer_phone' => ['required', 'string', 'max:30'],
            'customer_email' => ['nullable', 'email', 'max:255'],
            'type' => ['required', 'in:pickup,delivery'],
            'address' => ['required_if:type,delivery', 'nullable', 'string', 'max:255'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'integer', 'exists:products,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:50'],
            // Selected option value ids (see product.option_groups).
            'items.*.options' => ['nullable', 'array'],
            'items.*.options.*' => ['integer', 'exists:product_option_values,id'],
            'promo_code' => ['nullable', 'string', 'max:40'],
            'redeem_points' => ['nullable', 'integer', 'min:1'],
        ]);

        // Link the order to the signed-in client when a token is present,
        // otherwise the order stays a guest order (route remains public).
        $userId = Auth::guard('sanctum')->id();

        $order = DB::transaction(function () use ($validated, $userId) {
            $productIds = array_column($validated['items'], 'product_id');
            // Lock the rows to avoid concurrent overselling.
            $products = Product::with('optionGroups.values')
                ->whereIn('id', $productIds)->lockForUpdate()->get()->keyBy('id');

            foreach ($validated['items'] as $item) {
                if (! $products->has($item['product_id'])) {
                    throw ValidationException::withMessages([
                        'items' => 'One or more products no longer exist.',
                    ]);
                }
            }

            $requested = collect($validated['items'])
                ->groupBy('product_id')
                ->map(fn ($items) => (int) $items->sum('quantity'));

            foreach ($requested as $productId => $quantity) {
                $product = $products[$productId];

                if (! $product->inStock()) {
                    throw ValidationException::withMessages([
                        'items' => "{$product->name_fr} is out of stock.",
                    ]);
                }

                if ($product->stock !== null && $quantity > $product->stock) {
                    throw ValidationException::withMessages([
                        'items' => "Only {$product->stock} left in stock for {$product->name_fr}.",
                    ]);
                }
            }

            $subtotal = (float) collect($validated['items'])->sum(function ($item) use ($products) {
                $product = $products[$item['product_id']];

                return ($product->price + $this->optionsDelta($item, $product)) * $item['quantity'];
            });

            $promoCode = $validated['promo_code'] ?? null;
            $redeemPoints = $validated['redeem_points'] ?? null;

            if ($promoCode && $redeemPoints) {
                throw ValidationException::withMessages([
                    'promo_code' => 'A promo code and loyalty points cannot be combined.',
                ]);
            }

            [$discount, $promo, $pointsUsed] = $this->resolveDiscount(
                $subtotal,
                $promoCode,
                $redeemPoints,
                $userId,
            );

            $total = round($subtotal - $discount, 2);

            $order = Order::create([
                'user_id' => $userId,
                'customer_name' => $validated['customer_name'],
                'customer_phone' => $validated['customer_phone'],
                'customer_email' => $validated['customer_email'] ?? null,
                'type' => $validated['type'],
                'address' => $validated['address'] ?? null,
                'subtotal' => $subtotal,
                'discount' => $discount,
                'promo_code' => $promo?->code,
                'points_redeemed' => $pointsUsed,
                'total' => $total,
                'status' => 'pending',
            ]);

            foreach ($validated['items'] as $item) {
                $product = $products[$item['product_id']];
                $values = $this->resolveOptions($item, $product);

                $orderItem = $order->items()->create([
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    // Unit price including the selected option deltas.
                    'price' => round($product->price + $values->sum(fn ($value) => (float) $value->price_delta), 2),
                ]);

                $this->snapshotOptions($orderItem, $values);
            }

            // Apply the loyalty/ promo side-effects.
            if ($promo) {
                $promo->increment('used_count');
            }

            // Decrement tracked stock (NULL stock = unlimited, untouched).
            foreach ($requested as $productId => $quantity) {
                if ($products[$productId]->stock !== null) {
                    $products[$productId]->decrement('stock', $quantity);
                }
            }

            if ($pointsUsed > 0) {
                $user = $order->user()->first();
                $user->loyalty_points = $user->loyalty_points - $pointsUsed;
                $user->save();

                LoyaltyTransaction::create([
                    'user_id' => $user->id,
                    'order_id' => $order->id,
                    'points' => -$pointsUsed,
                    'type' => 'redeemed',
                    'description' => "Redemption for order #{$order->id}",
                ]);
            }

            return $order;
        });

        return (new OrderResource($order->load('items.product', 'items.options')))->response()->setStatusCode(201);
    }

    public function show(Order $order): JsonResponse
    {
        return (new OrderResource($order->load('items.product', 'items.options')))->response();
    }

    /**
     * Preview subtotal / discount / total without creating an order.
     * Powers the checkout summary (promo code and point redemption).
     */
    public function preview(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'integer', 'exists:products,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:50'],
            // Selected option value ids (see product.option_groups).
            'items.*.options' => ['nullable', 'array'],
            'items.*.options.*' => ['integer', 'exists:product_option_values,id'],
            'promo_code' => ['nullable', 'string', 'max:40'],
            'redeem_points' => ['nullable', 'integer', 'min:0'],
        ]);

        $userId = Auth::guard('sanctum')->id();

        $productIds = array_column($validated['items'], 'product_id');
        $products = Product::with('optionGroups.values')
            ->whereIn('id', $productIds)->get()->keyBy('id');

        // Surface stock problems early so checkout can show them before submit.
        $requested = collect($validated['items'])
            ->groupBy('product_id')
            ->map(fn ($items) => (int) $items->sum('quantity'));

        foreach ($requested as $productId => $quantity) {
            $product = $products->get($productId);

            if (! $product) {
                continue;
            }

            if (! $product->inStock()) {
                throw ValidationException::withMessages([
                    'items' => "{$product->name_fr} is out of stock.",
                ]);
            }

            if ($product->stock !== null && $quantity > $product->stock) {
                throw ValidationException::withMessages([
                    'items' => "Only {$product->stock} left in stock for {$product->name_fr}.",
                ]);
            }
        }

        $subtotal = (float) collect($validated['items'])->sum(function ($item) use ($products) {
            $product = $products->get($item['product_id']);

            if (! $product) {
                return 0;
            }

            return ($product->price + $this->optionsDelta($item, $product)) * $item['quantity'];
        });

        $promoCode = $validated['promo_code'] ?? null;
        $redeemPoints = ($validated['redeem_points'] ?? 0) ?: null;

        if ($promoCode && $redeemPoints) {
            throw ValidationException::withMessages([
                'promo_code' => 'A promo code and loyalty points cannot be combined.',
            ]);
        }

        [$discount] = $this->resolveDiscount($subtotal, $promoCode, $redeemPoints, $userId);

        return response()->json([
            'subtotal' => round($subtotal, 2),
            'discount' => round($discount, 2),
            'total' => round($subtotal - $discount, 2),
        ]);
    }

    /**
     * Price delta added by the options selected on one cart line.
     */
    private function optionsDelta(array $item, Product $product): float
    {
        return (float) $this->resolveOptions($item, $product)
            ->sum(fn (ProductOptionValue $value) => (float) $value->price_delta);
    }

    /**
     * Validate the option ids picked for a product line and return the
     * matching values, grouped so each group's rules can be checked.
     *
     * @return Collection<int, ProductOptionValue>
     */
    private function resolveOptions(array $item, Product $product)
    {
        $ids = collect($item['options'] ?? []);

        if ($ids->isEmpty()) {
            $ids = collect();
        }

        $values = $ids->isEmpty()
            ? collect()
            : ProductOptionValue::with('group')
                ->whereIn('id', $ids->unique()->all())
                ->get();

        // Every id must belong to a group of THIS product.
        $foreign = $values->filter(
            fn (ProductOptionValue $value) => (int) $value->group?->product_id !== (int) $product->id
        );

        if ($foreign->isNotEmpty()) {
            throw ValidationException::withMessages([
                'items.options' => "Some options do not belong to {$product->name_fr}.",
            ]);
        }

        $groups = $product->optionGroups()->with('values')->get();

        foreach ($groups as $group) {
            $picked = $values->where('product_option_group_id', $group->id);

            if ($group->isSingle() && $picked->count() > 1) {
                throw ValidationException::withMessages([
                    'items.options' => "Only one option can be chosen for {$group->name_fr}.",
                ]);
            }

            if ($group->is_required && $picked->isEmpty()) {
                throw ValidationException::withMessages([
                    'items.options' => "{$group->name_fr} is required for {$product->name_fr}.",
                ]);
            }
        }

        return $values->values();
    }

    /**
     * Freeze the chosen options onto the order line so history survives
     * later menu edits or deletions.
     */
    private function snapshotOptions(OrderItem $orderItem, $values): void
    {
        foreach ($values as $value) {
            $group = $value->group;

            $orderItem->options()->create([
                'product_option_value_id' => $value->id,
                'group_name_fr' => $group->name_fr,
                'group_name_en' => $group->name_en,
                'group_name_ar' => $group->name_ar,
                'name_fr' => $value->name_fr,
                'name_en' => $value->name_en,
                'name_ar' => $value->name_ar,
                'price_delta' => $value->price_delta,
            ]);
        }
    }

    /**
     * Compute and validate the discount for a promo code or point redemption.
     *
     * @return array{0: float, 1: Promo|null, 2: int}
     */
    private function resolveDiscount(float $subtotal, ?string $promoCode, ?int $redeemPoints, ?int $userId): array
    {
        if ($promoCode !== null && trim($promoCode) !== '') {
            $promo = (new Promo)->findUsable($promoCode);

            if (! $promo) {
                throw ValidationException::withMessages([
                    'promo_code' => 'This promo code is invalid or has expired.',
                ]);
            }

            if ($promo->min_total !== null && $subtotal < (float) $promo->min_total) {
                throw ValidationException::withMessages([
                    'promo_code' => 'A minimum order of '.number_format((float) $promo->min_total, 2).' DT is required.',
                ]);
            }

            return [$promo->discountFor($subtotal), $promo, 0];
        }

        if ($redeemPoints !== null && $redeemPoints > 0) {
            if (! $userId) {
                throw ValidationException::withMessages([
                    'redeem_points' => 'You must be signed in to use loyalty points.',
                ]);
            }

            $user = User::findOrFail($userId);

            if ($redeemPoints % self::REDEEM_STEP !== 0) {
                throw ValidationException::withMessages([
                    'redeem_points' => 'Points must be redeemed in blocks of '.self::REDEEM_STEP.'.',
                ]);
            }

            if ($redeemPoints > $user->loyalty_points) {
                throw ValidationException::withMessages([
                    'redeem_points' => 'You do not have enough points.',
                ]);
            }

            $potential = ($redeemPoints / self::REDEEM_STEP) * self::REDEEM_STEP_VALUE;
            $cap = round($subtotal * self::POINTS_DISCOUNT_CAP, 2);

            if ($potential > $cap) {
                throw ValidationException::withMessages([
                    'redeem_points' => 'Point redemption is capped at '.(self::POINTS_DISCOUNT_CAP * 100).'% of the order.',
                ]);
            }

            return [$potential, null, $redeemPoints];
        }

        return [0.0, null, 0];
    }
}
