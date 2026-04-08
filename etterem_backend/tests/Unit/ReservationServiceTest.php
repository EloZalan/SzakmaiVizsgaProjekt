<?php

use App\Models\Order;
use App\Models\Reservation;
use App\Models\Table;
use App\Models\User;
use App\Services\ReservationService;

test('a ReservationService a legkisebb megfelelő kapacitású asztalt választja', function () {
    $service = new ReservationService();

    $smallerTable = Table::create(['capacity' => 7]);
    $largerTable = Table::create(['capacity' => 8]);

    $result = $service->findAvailableTable(now()->addDays(7), 7);

    expect($result)->not->toBeNull()
        ->and($result->id)->toBe($smallerTable->id)
        ->and($result->capacity)->toBe(7)
        ->and($result->id)->not->toBe($largerTable->id);
});

test('átfedő aktív foglalás esetén a következő megfelelő asztalt választja', function () {
    $service = new ReservationService();
    $requestedTime = now()->addDays(7)->setTime(18, 0);

    $blockedTable = Table::create(['capacity' => 7]);
    $fallbackTable = Table::create(['capacity' => 8]);

    Reservation::create([
        'table_id' => $blockedTable->id,
        'guest_name' => 'Ütköző Foglalás',
        'phone_number' => '+36301234567',
        'start_time' => $requestedTime->copy()->subMinutes(30),
        'end_time' => $requestedTime->copy()->addMinutes(30),
        'guest_count' => 4,
    ]);

    $result = $service->findAvailableTable($requestedTime, 7);

    expect($result)->not->toBeNull()
        ->and($result->id)->toBe($fallbackTable->id);
});

test('admin által felszabadított foglalást figyelmen kívül hagy a ReservationService', function () {
    $service = new ReservationService();
    $requestedTime = now()->addDays(8)->setTime(19, 0);

    $table = Table::create(['capacity' => 7]);

    Reservation::create([
        'table_id' => $table->id,
        'guest_name' => 'Felszabadított',
        'phone_number' => '+36301234567',
        'start_time' => $requestedTime->copy(),
        'end_time' => $requestedTime->copy()->addHours(2),
        'guest_count' => 5,
        'admin_released_at' => now(),
    ]);

    $result = $service->findAvailableTable($requestedTime, 7);

    expect($result)->not->toBeNull()
        ->and($result->id)->toBe($table->id);
});

test('done rendeléshez tartozó átfedő foglalást figyelmen kívül hagy a ReservationService', function () {
    $service = new ReservationService();
    $waiter = User::where('email', 'waiter1@test.com')->firstOrFail();
    $requestedTime = now()->addDays(9)->setTime(18, 0);

    $table = Table::create(['capacity' => 7]);

    $reservation = Reservation::create([
        'table_id' => $table->id,
        'guest_name' => 'Már Lezárt',
        'phone_number' => '+36301234567',
        'start_time' => $requestedTime->copy(),
        'end_time' => $requestedTime->copy()->addHours(2),
        'guest_count' => 4,
    ]);

    Order::create([
        'table_id' => $table->id,
        'waiter_id' => $waiter->id,
        'reservation_id' => $reservation->id,
        'total_price' => 10000,
        'status' => 'done',
    ]);

    $result = $service->findAvailableTable($requestedTime, 7);

    expect($result)->not->toBeNull()
        ->and($result->id)->toBe($table->id);
});

test('aktív rendelés alatt álló asztalt nem ad vissza a ReservationService', function () {
    $service = new ReservationService();
    $waiter = User::where('email', 'waiter1@test.com')->firstOrFail();
    $requestedTime = now()->addDays(10)->setTime(18, 0);

    $blockedTable = Table::create(['capacity' => 7]);
    $fallbackTable = Table::create(['capacity' => 8]);

    Order::create([
        'table_id' => $blockedTable->id,
        'waiter_id' => $waiter->id,
        'total_price' => 5000,
        'status' => 'in_progress',
    ]);

    $result = $service->findAvailableTable($requestedTime, 7);

    expect($result)->not->toBeNull()
        ->and($result->id)->toBe($fallbackTable->id);
});

test('nullt ad vissza ha nincs elég nagy szabad asztal', function () {
    $service = new ReservationService();

    $result = $service->findAvailableTable(now()->addDays(7), 20);

    expect($result)->toBeNull();
});
