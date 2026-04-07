<?php

use App\Models\User;

test('admin lekérheti a napi bevételt', function () {
    /** @var \Tests\TestCase $this */
    $admin = User::where('email', 'admin@test.com')->firstOrFail();

    $this->actingAs($admin)
        ->getJson('/api/admin/daily-revenue')
        ->assertStatus(200)
        ->assertJsonStructure(['daily_revenue']);
});

test('admin lekérheti a mai vendégszámot', function () {
    /** @var \Tests\TestCase $this */
    $admin = User::where('email', 'admin@test.com')->firstOrFail();

    $this->actingAs($admin)
        ->getJson('/api/admin/today-guests')
        ->assertStatus(200)
        ->assertJsonStructure(['today_guests']);
});

test('admin lekérheti a vendégszám-előzményeket', function () {
    /** @var \Tests\TestCase $this */
    $admin = User::where('email', 'admin@test.com')->firstOrFail();

    $this->actingAs($admin)
        ->getJson('/api/admin/guest-count-history')
        ->assertStatus(200)
        ->assertJsonStructure([['date', 'guest_count']]);
});
