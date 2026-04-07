<?php

use App\Models\MenuCategory;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Reservation;
use App\Models\User;

test('pincér rendelést nyithat egy foglalással rendelkező asztalnál', function () {
    /** @var \Tests\TestCase $this */
    $waiter = User::where('email', 'waiter1@test.com')->firstOrFail();

    $futureReservation = Reservation::where('start_time', '>', now())
        ->whereDoesntHave('order')
        ->first();

    $futureReservation->start_time = now()->subMinutes(10);
    $futureReservation->end_time = now()->addMinutes(110);
    $futureReservation->save();

    $this->actingAs($waiter)
        ->postJson("/api/tables/{$futureReservation->table_id}/orders")
        ->assertStatus(201)
        ->assertJsonStructure(['id', 'table_id', 'status']);
});

test('pincér lekerheti egy aktiv asztal rendeleseteteleket', function () {
    /** @var \Tests\TestCase $this */
    $waiter = User::where('email', 'waiter1@test.com')->firstOrFail();
    $order = Order::whereIn('status', ['in_progress', 'ready_to_pay'])->firstOrFail();

    $this->actingAs($waiter)
        ->getJson("/api/tables/{$order->table_id}/orders")
        ->assertStatus(200)
        ->assertJsonStructure([
            'order_id',
            'table_id',
            'reservation_id',
            'status',
            'total_price',
            'opened_at',
            'items',
        ])
        ->assertJsonFragment([
            'order_id' => $order->id,
            'table_id' => $order->table_id,
        ]);
});

test('pincér tételt adhat egy nyitott rendeléshez', function () {
    /** @var \Tests\TestCase $this */
    $waiter = User::where('email', 'waiter1@test.com')->firstOrFail();
    $order = Order::where('status', 'in_progress')->first();
    $menuItem = MenuItem::whereHas('menuCategory', function ($q) {
        $q->where('name', '!=', MenuCategory::UNAVAILABLE_CATEGORY_NAME);
    })->first();

    $this->actingAs($waiter)
        ->postJson("/api/orders/{$order->id}/items", [
            'menu_item_id' => $menuItem->id,
            'quantity' => 2,
        ])
        ->assertStatus(201)
        ->assertJsonStructure(['item', 'quantity', 'current_total']);
});

test('pincér törölhet tételt egy nyitott rendelésből', function () {
    /** @var \Tests\TestCase $this */
    $waiter = User::where('email', 'waiter1@test.com')->firstOrFail();
    $order = Order::where('status', 'in_progress')->first();
    $orderItem = OrderItem::where('order_id', $order->id)->first();

    $this->actingAs($waiter)
        ->deleteJson("/api/orders/{$order->id}/items/{$orderItem->id}")
        ->assertStatus(200);
});

test('pincér fizetésre kész státuszba teszi a rendelést', function () {
    /** @var \Tests\TestCase $this */
    $waiter = User::where('email', 'waiter1@test.com')->firstOrFail();
    $order = Order::where('status', 'in_progress')
        ->whereHas('orderItems')
        ->first();

    $this->actingAs($waiter)
        ->postJson("/api/orders/{$order->id}/simulate-ready")
        ->assertStatus(200)
        ->assertJsonFragment(['new_status' => 'ready_to_pay']);
});

test('pincér lezárhatja a rendelést fizetéssel', function () {
    /** @var \Tests\TestCase $this */
    $waiter = User::where('email', 'waiter1@test.com')->firstOrFail();
    $order = Order::where('status', 'ready_to_pay')->first();

    $this->actingAs($waiter)
        ->postJson("/api/orders/{$order->id}/pay", [
            'payment_method' => 'cash',
            'tip' => 500,
        ])
        ->assertStatus(200)
        ->assertJsonFragment(['order_status' => 'done']);
});
