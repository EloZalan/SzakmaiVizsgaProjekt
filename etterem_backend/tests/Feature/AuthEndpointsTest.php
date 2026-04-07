<?php

use App\Models\User;

test('sikeres bejelentkezés tokent ad vissza', function () {
    /** @var \Tests\TestCase $this */
    $response = $this->postJson('/api/login', [
        'email' => 'admin@test.com',
        'password' => 'password',
    ]);

    $response->assertStatus(200)
        ->assertJsonStructure(['token', 'user']);
});

test('hibás jelszóval 401-es választ kap', function () {
    /** @var \Tests\TestCase $this */
    $response = $this->postJson('/api/login', [
        'email' => 'admin@test.com',
        'password' => 'rossz_jelszo',
    ]);

    $response->assertStatus(401);
});

test('bejelentkezett felhasználó lekérheti saját adatait', function () {
    /** @var \Tests\TestCase $this */
    $admin = User::where('email', 'admin@test.com')->firstOrFail();

    $this->actingAs($admin)
        ->getJson('/api/user')
        ->assertStatus(200)
        ->assertJsonFragment(['email' => 'admin@test.com']);
});

test('nem bejelentkezett felhasználó 401-est kap a /user végponton', function () {
    /** @var \Tests\TestCase $this */
    $this->getJson('/api/user')
        ->assertStatus(401);
});

test('kijelentkezés sikeresen visszavonja a tokent', function () {
    /** @var \Tests\TestCase $this */
    $waiter = User::where('email', 'waiter1@test.com')->firstOrFail();
    $token = $waiter->createToken('test')->plainTextToken;

    $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/logout')
        ->assertStatus(200);
});

test('pincér felveheti a műszakot', function () {
    /** @var \Tests\TestCase $this */
    $waiter = User::where('email', 'waiter2@test.com')->firstOrFail();

    $this->actingAs($waiter)
        ->postJson('/api/take-shift')
        ->assertStatus(200)
        ->assertJsonFragment(['on_shift' => true]);
});

test('pincér leadhatja a műszakot', function () {
    /** @var \Tests\TestCase $this */
    $waiter = User::where('email', 'waiter1@test.com')->firstOrFail();

    $this->actingAs($waiter)
        ->postJson('/api/end-shift')
        ->assertStatus(200)
        ->assertJsonFragment(['on_shift' => false]);
});

test('bejelentkezett felhasználó frissítheti az emailjét', function () {
    /** @var \Tests\TestCase $this */
    $waiter = User::where('email', 'waiter2@test.com')->firstOrFail();

    $this->actingAs($waiter)
        ->putJson('/api/user', ['email' => 'uj-email@test.com'])
        ->assertStatus(200)
        ->assertJsonFragment(['email' => 'uj-email@test.com']);
});