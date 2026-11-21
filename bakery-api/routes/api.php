<?php

use App\Http\Controllers\Api\Admin\AdminOrderController;
use App\Http\Controllers\Api\Admin\AdminProductController;
use App\Http\Controllers\Api\Admin\AdminPromoController;
use App\Http\Controllers\Api\Admin\AdminReservationController;
use App\Http\Controllers\Api\Admin\AdminReviewController;
use App\Http\Controllers\Api\Admin\AdminUserController;
use App\Http\Controllers\Api\Admin\StatsController;
use App\Http\Controllers\Api\AllergenController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\ReservationController;
use App\Http\Controllers\Api\ReviewController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Routes are registered in bootstrap/app.php with the "api:" option,
| which applies the "api" middleware group and the /api URL prefix.
|
*/

Route::get('/categories', [CategoryController::class, 'index']);
Route::get('/allergens', [AllergenController::class, 'index']);
Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/{product}', [ProductController::class, 'show']);
Route::post('/orders', [OrderController::class, 'store']);
Route::post('/orders/preview', [OrderController::class, 'preview']);
Route::get('/orders/{order}', [OrderController::class, 'show']);

// Product reviews: public list, authenticated create/update, author/staff delete.
Route::get('/products/{product}/reviews', [ReviewController::class, 'index']);
Route::delete('/reviews/{review}', [ReviewController::class, 'destroy'])->middleware('auth:sanctum');

/*
|--------------------------------------------------------------------------
| Client authentication (public)
|--------------------------------------------------------------------------
*/
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);

// Any authenticated user (client or staff).
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::patch('/auth/profile', [AuthController::class, 'updateProfile']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    // Client account: own orders & reservations.
    Route::get('/auth/orders', [AuthController::class, 'orders']);
    Route::get('/auth/reservations', [AuthController::class, 'reservations']);
    Route::get('/auth/loyalty', [AuthController::class, 'loyalty']);
    Route::patch('/auth/reservations/{reservation}/cancel', [AuthController::class, 'cancelReservation']);

    // Authenticated clients write product reviews (one per product).
    Route::post('/products/{product}/reviews', [ReviewController::class, 'store']);
});

// Reservations require a client account.
Route::post('/reservations', [ReservationController::class, 'store'])->middleware('auth:sanctum');
Route::get('/reservations/{reservation}', [ReservationController::class, 'show']);

/*
|--------------------------------------------------------------------------
| Admin API (Sanctum-authenticated staff only)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum', 'staff')->prefix('admin')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::get('/stats', [StatsController::class, 'index']);

    Route::get('/products', [AdminProductController::class, 'index']);
    Route::get('/products/categories', [AdminProductController::class, 'categories']);
    Route::post('/products', [AdminProductController::class, 'store']);
    Route::get('/products/{product}', [AdminProductController::class, 'show']);
    Route::put('/products/{product}', [AdminProductController::class, 'update']);
    Route::delete('/products/{product}', [AdminProductController::class, 'destroy']);

    Route::get('/orders', [AdminOrderController::class, 'index']);
    Route::get('/orders/{order}', [AdminOrderController::class, 'show']);
    Route::patch('/orders/{order}/status', [AdminOrderController::class, 'updateStatus']);

    Route::get('/reservations', [AdminReservationController::class, 'index']);
    Route::patch('/reservations/{reservation}/status', [AdminReservationController::class, 'updateStatus']);

    Route::get('/reviews', [AdminReviewController::class, 'index']);
    Route::patch('/reviews/{review}/status', [AdminReviewController::class, 'updateStatus']);
    Route::delete('/reviews/{review}', [AdminReviewController::class, 'destroy']);

    Route::get('/promos', [AdminPromoController::class, 'index']);
    Route::post('/promos', [AdminPromoController::class, 'store']);
    Route::put('/promos/{promo}', [AdminPromoController::class, 'update']);
    Route::delete('/promos/{promo}', [AdminPromoController::class, 'destroy']);
});

/*
|--------------------------------------------------------------------------
| Staff management (admin accounts only — employees must not manage staff)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum', 'admin')->prefix('admin')->group(function () {
    Route::get('/users', [AdminUserController::class, 'index']);
    Route::post('/users', [AdminUserController::class, 'store']);
    Route::put('/users/{user}', [AdminUserController::class, 'update']);
    Route::patch('/users/{user}/status', [AdminUserController::class, 'updateStatus']);
    Route::delete('/users/{user}', [AdminUserController::class, 'destroy']);
});
