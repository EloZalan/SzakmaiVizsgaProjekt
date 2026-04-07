<?php

use App\Models\Table;
use App\Models\User;

test('műszakban lévő pincér látja az asztalokat', function () {
    /** @var \Tests\TestCase $this */
    $waiter = User::where('email', 'waiter1@test.com')->firstOrFail();

    $this->actingAs($waiter)
        ->getJson('/api/tables')
        ->assertStatus(200)
        ->assertJsonStructure([['id', 'capacity', 'status']]);
});

test('nem műszakban lévő pincér 403-at kap az asztaloknál', function () {
    /** @var \Tests\TestCase $this */
    $waiter = User::where('email', 'waiter2@test.com')->firstOrFail();

    $this->actingAs($waiter)
        ->getJson('/api/tables')
        ->assertStatus(403);
});

test('műszakban lévő pincér lekérhet egy asztalt', function () {
    /** @var \Tests\TestCase $this */
    $waiter = User::where('email', 'waiter1@test.com')->firstOrFail();
    $table = Table::first();

    $this->actingAs($waiter)
        ->getJson("/api/tables/{$table->id}")
        ->assertStatus(200)
        ->assertJsonFragment(['id' => $table->id]);
});