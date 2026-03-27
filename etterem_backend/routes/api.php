<?php

use App\Http\Controllers\AdminActionsController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\ReservationController;
use App\Http\Controllers\TableController;
use App\Http\Controllers\MenuItemController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::middleware(['security.headers', 'throttle:api'])->group(function () {
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:login');
    Route::post('/reservations', [ReservationController::class, 'store']);
    Route::get('/tables/max-capacity', [TableController::class, 'maxCapacity']);

    Route::get('/menu-categories', [\App\Http\Controllers\MenuCategoryController::class, 'index']);
    Route::get('/menu-categories/{menu_category}', [\App\Http\Controllers\MenuCategoryController::class, 'show']);

    Route::get('/menu-items', [MenuItemController::class, 'index']);
    Route::get('/menu-items/{menu_item}', [MenuItemController::class, 'show']);

    Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [AuthController::class, 'me']);
    Route::post('/take-shift', [AuthController::class, 'takeShift']);
    Route::post('/end-shift', [AuthController::class, 'endShift']);
    Route::put('/user', [AuthController::class, 'update']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/take-shift', [AuthController::class, 'takeShift']);

    Route::middleware('waiter.shift')->group(function () {
        Route::post('/reservations/walk-in', [ReservationController::class, 'storeWalkIn']);

        Route::get('/reservations', [ReservationController::class, 'index']);
        Route::get('/reservations/today-with-orders', [ReservationController::class, 'todayWithOrders']);
        Route::get('/reservations/{reservation}', [ReservationController::class, 'show']);
        Route::put('/reservations/{reservation}', [ReservationController::class, 'update']);
        Route::delete('/reservations/{reservation}', [ReservationController::class, 'destroy']);

        Route::get('/tables', [TableController::class, 'index']);
        Route::get('tables/{table}', [TableController::class, 'show']);
        Route::post('/tables/{table}/orders', [OrderController::class, 'openOrder']);
        Route::get('/tables/{table}/orders', [OrderController::class, 'getAllOrder']);

        Route::post('/orders/{order}/items', [OrderController::class, 'addItem']);
        Route::delete('/orders/{order}/items/{orderItem}', [OrderController::class, 'deleteItem']);
        Route::post('/orders/{order}/simulate-ready', [OrderController::class, 'simulateReadyToPay']);
        Route::post('/orders/{order}/pay', [PaymentController::class, 'pay']);
    });

    Route::middleware('admin')->group(function () {
        Route::get('admin/waiters', [AdminActionsController::class, 'getAllWaiter']);
        Route::post('/admin/waiters', [AdminActionsController::class, 'addWaiter']);
        Route::delete('/admin/waiters/{id}', [AdminActionsController::class, 'deleteWaiter']);
        Route::get('/admin/daily-revenue', [AdminActionsController::class, 'getDailyRevenue']);
        Route::get('/admin/today-guests', [AdminActionsController::class, 'getTodayGuests']);
        Route::get('/admin/guest-count-history', [AdminActionsController::class, 'getGuestCountHistory']);

        Route::get('/admin/tables', [TableController::class, 'index']);
        Route::post('/admin/tables', [TableController::class, 'store']);
        Route::put('/admin/tables/{table}', [TableController::class, 'update']);
        Route::post('/admin/tables/{table}/reset-to-free', [TableController::class, 'resetToFree']);
        Route::delete('/admin/tables/{table}', [TableController::class, 'destroy']);

        Route::post('/admin/menu-categories', [\App\Http\Controllers\MenuCategoryController::class, 'store']);
        Route::put('/admin/menu-categories/{menu_category}', [\App\Http\Controllers\MenuCategoryController::class, 'update']);
        Route::delete('/admin/menu-categories/{menu_category}', [\App\Http\Controllers\MenuCategoryController::class, 'destroy']);

        Route::get('/admin/menu-items', [MenuItemController::class, 'adminIndex']);
        Route::post('/admin/menu-items', [MenuItemController::class, 'store']);
        Route::put('/admin/menu-items/{menu_item}', [MenuItemController::class, 'update']);
        Route::delete('/admin/menu-items/{menu_item}', [MenuItemController::class, 'destroy']);
    });
    });
});



