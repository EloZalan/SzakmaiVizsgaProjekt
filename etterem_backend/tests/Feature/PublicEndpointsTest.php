<?php

use App\Models\MenuCategory;
use App\Models\MenuItem;

test('publikus menülista visszaadja az ételeket', function () {
    /** @var \Tests\TestCase $this */
    $response = $this->getJson('/api/menu-items');

    $response->assertStatus(200)
        ->assertJsonStructure([['id', 'name', 'price']]);
});

test('egy konkrét ételelem lekérése sikeres', function () {
    /** @var \Tests\TestCase $this */
    $item = MenuItem::first();

    $this->getJson("/api/menu-items/{$item->id}")
        ->assertStatus(200)
        ->assertJsonFragment(['id' => $item->id]);
});

test('publikus menükategória-lista visszaadja a kategóriákat', function () {
    /** @var \Tests\TestCase $this */
    $response = $this->getJson('/api/menu-categories');

    $response->assertStatus(200)
        ->assertJsonStructure([['id', 'name']]);
});

test('publikus: egy konkrét menükategória lekérése sikeres', function () {
    /** @var \Tests\TestCase $this */
    $category = MenuCategory::where('name', '!=', MenuCategory::UNAVAILABLE_CATEGORY_NAME)->first();

    $this->getJson("/api/menu-categories/{$category->id}")
        ->assertStatus(200)
        ->assertJsonFragment(['id' => $category->id]);
});

test('max kapacitás végpont visszaadja a legnagyobb asztal méretét', function () {
    /** @var \Tests\TestCase $this */
    $response = $this->getJson('/api/tables/max-capacity');

    $response->assertStatus(200)
        ->assertJsonStructure(['max_capacity']);

    $this->assertGreaterThan(0, $response->json('max_capacity'));
});

test('vendég sikeresen foglalhat asztalt', function () {
    /** @var \Tests\TestCase $this */
    $response = $this->postJson('/api/reservations', [
        'guest_name' => 'Kiss János',
        'phone_number' => '+36201234567',
        'guest_count' => 2,
        'start_time' => now()->addDays(3)->toIso8601String(),
    ]);

    $response->assertStatus(201)
        ->assertJsonFragment(['guest_name' => 'Kiss János']);
});