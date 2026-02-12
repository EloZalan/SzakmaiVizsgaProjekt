<?php

use App\Http\Controllers\AdminActionsController;
use App\Http\Controllers\AuthController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum', 'check.activity')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::middleware('admin')->group(function () {
        Route::post('/add-waiter', [AdminActionsController::class, 'addWaiter']);
        Route::delete('/delete-waiter', [AdminActionsController::class, 'deleteWaiter']);
    });
});



