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

Route::post('/login', [AuthController::class, 'login']);
Route::post('/reservations', [ReservationController::class, 'store']);

Route::get('/menu-categories', [\App\Http\Controllers\MenuCategoryController::class, 'index']);
Route::get('/menu-categories/{menu_category}', [\App\Http\Controllers\MenuCategoryController::class, 'show']);

Route::get('/menu-items', [MenuItemController::class, 'index']);
Route::get('/menu-items/{menu_item}', [MenuItemController::class, 'show']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [AuthController::class, 'me']);
    Route::post('/take-shift', [AuthController::class, 'takeShift']);
    Route::put('/user', [AuthController::class, 'update']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/take-shift', [AuthController::class, 'takeShift']);

    Route::middleware('waiter.shift')->group(function () {
        Route::post('/reservations/walk-in', [ReservationController::class, 'storeWalkIn']);

        Route::get('/reservations', [ReservationController::class, 'index']);
        Route::get('/reservations/{reservation}', [ReservationController::class, 'show']);
        Route::put('/reservations/{reservation}', [ReservationController::class, 'update']);
        Route::delete('/reservations/{reservation}', [ReservationController::class, 'destroy']);

        Route::get('/tables', [TableController::class, 'index']);
        Route::get('tables/{table}', [TableController::class, 'show']);
        Route::post('/tables/{table}/orders', [OrderController::class, 'openOrder']);
        Route::get('/tables/{table}/orders', [OrderController::class, 'getAllOrder']);

        Route::post('/orders/{order}/items', [OrderController::class, 'addItem']);
        Route::post('/orders/{order}/simulate-ready', [OrderController::class, 'simulateReadyToPay']);
        Route::post('/orders/{order}/pay', [PaymentController::class, 'pay']);
    });

    Route::middleware('admin')->group(function () {
        Route::get('admin/waiters', [AdminActionsController::class, 'getAllWaiter']);
        Route::post('/admin/waiters', [AdminActionsController::class, 'addWaiter']);
        Route::delete('/admin/waiters/{id}', [AdminActionsController::class, 'deleteWaiter']);

        Route::post('/admin/tables', [TableController::class, 'store']);
        Route::put('/admin/tables/{table}', [TableController::class, 'update']);
        Route::delete('/admin/tables/{table}', [TableController::class, 'destroy']);

        Route::post('/admin/menu-categories', [\App\Http\Controllers\MenuCategoryController::class, 'store']);
        Route::put('/admin/menu-categories/{menu_category}', [\App\Http\Controllers\MenuCategoryController::class, 'update']);
        Route::delete('/admin/menu-categories/{menu_category}', [\App\Http\Controllers\MenuCategoryController::class, 'destroy']);

        Route::post('/admin/menu-items', [MenuItemController::class, 'store']);
        Route::put('/admin/menu-items/{menu_item}', [MenuItemController::class, 'update']);
        Route::delete('/admin/menu-items/{menu_item}', [MenuItemController::class, 'destroy']);
    });
});



