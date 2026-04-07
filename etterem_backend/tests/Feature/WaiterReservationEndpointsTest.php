<?php

use App\Models\Reservation;
use App\Models\User;

test('pincér helyszíni foglalást hozhat létre', function () {
    /** @var \Tests\TestCase $this */
    $waiter = User::where('email', 'waiter1@test.com')->firstOrFail();

    $this->actingAs($waiter)
        ->postJson('/api/reservations/walk-in', ['guest_count' => 2])
        ->assertStatus(201)
        ->assertJsonFragment(['guest_name' => 'Helyszíni vendég']);
});

test('műszakban lévő pincér listázhatja a foglalásokat', function () {
    /** @var \Tests\TestCase $this */
    $waiter = User::where('email', 'waiter1@test.com')->firstOrFail();

    $this->actingAs($waiter)
        ->getJson('/api/reservations')
        ->assertStatus(200)
        ->assertJsonStructure([['id', 'guest_name']]);
});

test('műszakban lévő pincér lekérheti a mai foglalásokat rendelésekkel', function () {
    /** @var \Tests\TestCase $this */
    $waiter = User::where('email', 'waiter1@test.com')->firstOrFail();

    $this->actingAs($waiter)
        ->getJson('/api/reservations/today-with-orders')
        ->assertStatus(200);
});

test('műszakban lévő pincér lekérhet egy foglalást', function () {
    /** @var \Tests\TestCase $this */
    $waiter = User::where('email', 'waiter1@test.com')->firstOrFail();
    $reservation = Reservation::first();

    $this->actingAs($waiter)
        ->getJson("/api/reservations/{$reservation->id}")
        ->assertStatus(200)
        ->assertJsonFragment(['id' => $reservation->id]);
});

test('műszakban lévő pincér frissítheti a foglalás megjegyzését', function () {
    /** @var \Tests\TestCase $this */
    $waiter = User::where('email', 'waiter1@test.com')->firstOrFail();
    $reservation = Reservation::where('start_time', '>', now())->first();

    $this->actingAs($waiter)
        ->putJson("/api/reservations/{$reservation->id}", ['note' => 'Teszt megjegyzés'])
        ->assertStatus(200)
        ->assertJsonFragment(['note' => 'Teszt megjegyzés']);
});

test('műszakban lévő pincér törölhet foglalást', function () {
    /** @var \Tests\TestCase $this */
    $waiter = User::where('email', 'waiter1@test.com')->firstOrFail();
    $reservation = Reservation::where('start_time', '>', now())->first();

    $this->actingAs($waiter)
        ->deleteJson("/api/reservations/{$reservation->id}")
        ->assertStatus(204);

    $this->assertDatabaseMissing('reservations', ['id' => $reservation->id]);
});