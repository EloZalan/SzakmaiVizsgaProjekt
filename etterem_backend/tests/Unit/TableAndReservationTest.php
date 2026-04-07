<?php

use App\Models\Order;
use App\Models\Reservation;
use App\Models\Table;
use App\Models\User;
use App\Services\ReservationService;

// 1. teszt – szabad asztal státusza "available"
test('egy üres asztal státusza available', function () {
    $table = Table::create(['capacity' => 4]);

    expect($table->status)->toBe('available');
});

// 2. teszt – folyamatban lévő rendelésű asztal "occupied"
test('folyamatban lévő rendelésnél az asztal occupied', function () {
    $waiter = User::where('email', 'waiter1@test.com')->firstOrFail();
    $table  = Table::create(['capacity' => 4]);

    Order::create([
        'table_id'    => $table->id,
        'waiter_id'   => $waiter->id,
        'total_price' => 0,
        'status'      => 'in_progress',
    ]);

    expect($table->fresh()->status)->toBe('occupied');
});

// 3. teszt – fizetésre váró rendelésnél "needs_payment"
test('fizetésre váró rendelésnél az asztal needs_payment', function () {
    $waiter = User::where('email', 'waiter1@test.com')->firstOrFail();
    $table  = Table::create(['capacity' => 4]);

    Order::create([
        'table_id'    => $table->id,
        'waiter_id'   => $waiter->id,
        'total_price' => 0,
        'status'      => 'ready_to_pay',
    ]);

    expect($table->fresh()->status)->toBe('needs_payment');
});

// 4. teszt – aktuális foglalásablakba eső asztal "reserved"
test('aktuális foglalásablakba eső asztal reserved', function () {
    $table = Table::create(['capacity' => 4]);

    Reservation::create([
        'table_id'          => $table->id,
        'guest_name'        => 'Teszt Vendég',
        'phone_number'      => '+36301234567',
        'start_time'        => now()->subHour(),
        'end_time'          => now()->addHour(),
        'guest_count'       => 2,
        'admin_released_at' => null,
    ]);

    expect($table->fresh()->status)->toBe('reserved');
});

// 5. teszt – ReservationService a legkisebb megfelelő szabad asztalt adja vissza
test('ReservationService a legkisebb kapacitású megfelelő asztalt adja vissza', function () {
    $service = new ReservationService();

    // A seeder 2 és 4 személyes szabad asztalokat is létrehoz; holnapra kérünk 2 főre.
    $result = $service->findAvailableTable(now()->addDay(), 2);

    expect($result)->not->toBeNull()
        ->and($result->capacity)->toBe(2);
});
