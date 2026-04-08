<?php

use App\Models\Order;
use App\Models\Reservation;
use App\Models\Table;
use App\Models\User;

test('egy üres asztal státusza available', function () {
    $table = Table::create(['capacity' => 4]);

    expect($table->status)->toBe('available');
});

test('folyamatban lévő rendelés felülírja az aktív foglalást és occupied státuszt ad', function () {
    $waiter = User::where('email', 'waiter1@test.com')->firstOrFail();
    $table = Table::create(['capacity' => 4]);

    Reservation::create([
        'table_id' => $table->id,
        'guest_name' => 'Aktív Foglalás',
        'phone_number' => '+36301234567',
        'start_time' => now()->subHour(),
        'end_time' => now()->addHour(),
        'guest_count' => 4,
    ]);

    Order::create([
        'table_id' => $table->id,
        'waiter_id' => $waiter->id,
        'total_price' => 12000,
        'status' => 'in_progress',
    ]);

    expect($table->fresh()->status)->toBe('occupied');
});

test('fizetésre váró rendelés needs_payment státuszt ad', function () {
    $waiter = User::where('email', 'waiter1@test.com')->firstOrFail();
    $table = Table::create(['capacity' => 4]);

    Order::create([
        'table_id' => $table->id,
        'waiter_id' => $waiter->id,
        'total_price' => 8500,
        'status' => 'ready_to_pay',
    ]);

    expect($table->fresh()->status)->toBe('needs_payment');
});

test('admin által felszabadított foglalás nem jelöli reservednek az asztalt', function () {
    $table = Table::create(['capacity' => 4]);

    Reservation::create([
        'table_id' => $table->id,
        'guest_name' => 'Felszabadított Foglalás',
        'phone_number' => '+36301234567',
        'start_time' => now()->subMinutes(30),
        'end_time' => now()->addMinutes(90),
        'guest_count' => 2,
        'admin_released_at' => now(),
    ]);

    expect($table->fresh()->status)->toBe('available');
});

test('lezárt rendeléshez tartozó foglalás nem tartja reserved státuszban az asztalt', function () {
    $waiter = User::where('email', 'waiter1@test.com')->firstOrFail();
    $table = Table::create(['capacity' => 4]);

    $reservation = Reservation::create([
        'table_id' => $table->id,
        'guest_name' => 'Lezárt Foglalás',
        'phone_number' => '+36301234567',
        'start_time' => now()->subHour(),
        'end_time' => now()->addHour(),
        'guest_count' => 2,
    ]);

    Order::create([
        'table_id' => $table->id,
        'waiter_id' => $waiter->id,
        'reservation_id' => $reservation->id,
        'total_price' => 9900,
        'status' => 'done',
    ]);

    expect($table->fresh()->status)->toBe('available');
});
