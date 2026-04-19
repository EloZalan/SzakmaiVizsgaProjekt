<?php

use App\Models\Order;
use App\Models\Table;
use App\Models\User;
use App\Services\ReservationService;
use Carbon\Carbon;
use Mockery\MockInterface;

test('kulon fixture fajlbol tolti be a foglalas payloadot', function () {
    $fixture = load_fixture('reservations/store.valid.php');
    $payload = $fixture['store_valid'];

    expect($fixture)
        ->toBeArray()
        ->toHaveKeys([
            'meta',
            'store_valid',
            'store_large_party',
            'store_invalid_phone',
            'store_missing_guest_name',
            'walk_in_valid',
            'update_note',
        ])
        ->and($fixture['meta']['locale'])->toBe('hu')
        ->and($payload)
        ->and($payload['guest_name'])->toBe('Fixture Vendeg')
        ->and($payload['guest_count'])->toBe(2)
        ->and($payload)->toHaveKeys([
            'guest_name',
            'phone_number',
            'guest_count',
            'start_time',
            'note',
        ]);
});

test('mockkal helyettesiti a reservation service valaszat a publikus foglalasnal', function () {
    /** @var \Tests\TestCase $this */
    $table = Table::query()
        ->where('capacity', '>=', 2)
        ->doesntHave('orders')
        ->doesntHave('reservations')
        ->firstOrFail();

    $payload = load_fixture('reservations/store.valid.php')['store_valid'];

    $mock = Mockery::mock(ReservationService::class);
    $mock->shouldReceive('findAvailableTable')
        ->once()
        ->withArgs(function (Carbon $requestedTime, int $guestCount) {
            return $requestedTime->isFuture() && $guestCount === 2;
        })
        ->andReturn($table);

    app()->instance(ReservationService::class, $mock);

    $this->postJson('/api/reservations', $payload)
        ->assertCreated()
        ->assertJsonFragment([
            'table_id' => $table->id,
            'guest_name' => 'Fixture Vendeg',
        ]);
});

test('stubbal fix asztalt ad vissza a walk in foglalashoz', function () {
    /** @var \Tests\TestCase $this */
    $waiter = User::where('email', 'waiter1@test.com')->firstOrFail();
    $table = Table::query()
        ->where('capacity', '>=', 4)
        ->doesntHave('orders')
        ->doesntHave('reservations')
        ->firstOrFail();

    $payload = load_fixture('reservations/store.valid.php')['walk_in_valid'];

    $stub = new class($table) extends ReservationService {
        public function __construct(private Table $table)
        {
        }

        public function findAvailableTable(Carbon $requestedTime, int $guestCount)
        {
            return $this->table;
        }
    };

    app()->instance(ReservationService::class, $stub);

    $this->actingAs($waiter)
        ->postJson('/api/reservations/walk-in', $payload)
        ->assertCreated()
        ->assertJsonFragment([
            'table_id' => $table->id,
        ]);
});

test('simulate ready to pay frissiti a rendelest', function () {
    /** @var \Tests\TestCase $this */
    $waiter = User::where('email', 'waiter1@test.com')->firstOrFail();
    $order = Order::query()
        ->where('status', 'in_progress')
        ->whereHas('orderItems')
        ->firstOrFail();

    $this->actingAs($waiter)
        ->postJson("/api/orders/{$order->id}/simulate-ready")
        ->assertOk()
        ->assertJsonFragment(['new_status' => 'ready_to_pay']);

    $order->refresh();
    expect($order->status)->toBe('ready_to_pay');
});
