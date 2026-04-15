<?php

use App\Models\MenuCategory;
use App\Models\MenuItem;
use App\Models\Reservation;
use App\Models\Table;
use App\Models\User;
use App\Mail\WaiterInviteMail;
use Illuminate\Support\Facades\Mail;

test('admin listázhatja a pincéreket', function () {
    /** @var \Tests\TestCase $this */
    $admin = User::where('email', 'admin@test.com')->firstOrFail();

    $this->actingAs($admin)
        ->getJson('/api/admin/waiters')
        ->assertStatus(200)
        ->assertJsonStructure([['id', 'name', 'email', 'role', 'on_shift']]);
});

test('pincér nem listázhatja az admin pincér-listát', function () {
    /** @var \Tests\TestCase $this */
    $waiter = User::where('email', 'waiter1@test.com')->firstOrFail();

    $this->actingAs($waiter)
        ->getJson('/api/admin/waiters')
        ->assertStatus(403);
});

test('admin hozzáadhat új pincért', function () {
    /** @var \Tests\TestCase $this */
    $admin = User::where('email', 'admin@test.com')->firstOrFail();

    Mail::fake();

    $this->actingAs($admin)
        ->postJson('/api/admin/waiters', [
            'name' => 'Új Pincér',
            'email' => 'ujpincer@test.com',
        ])
        ->assertStatus(201)
        ->assertJsonFragment([
            'email' => 'ujpincer@test.com',
            'invite_pending' => true,
        ]);

    $this->assertDatabaseHas('users', [
        'email' => 'ujpincer@test.com',
        'role' => 'waiter',
    ]);

    Mail::assertSent(WaiterInviteMail::class, function (WaiterInviteMail $mail) {
        return $mail->user->email === 'ujpincer@test.com';
    });

    expect(User::where('email', 'ujpincer@test.com')->firstOrFail()->invite_token)->not->toBeNull();
});

test('nyilvanos invite végpont visszaadja az aktiválható meghívót', function () {
    /** @var \Tests\TestCase $this */
    $user = User::create([
        'name' => 'Invite Teszt',
        'email' => 'invite@test.com',
        'password' => 'temporary-password',
        'role' => 'waiter',
        'invite_token' => hash('sha256', 'plain-test-token'),
        'invite_expires_at' => now()->addDay(),
        'invited_at' => now(),
    ]);

    $this->getJson('/api/waiter-invites/plain-test-token')
        ->assertStatus(200)
        ->assertJsonFragment([
            'name' => $user->name,
            'email' => $user->email,
        ]);
});

test('meghivo elfogadasa beallitja a jelszot es igazolja az emailt', function () {
    /** @var \Tests\TestCase $this */
    $user = User::create([
        'name' => 'Elfogado Pincer',
        'email' => 'elfogado@test.com',
        'password' => 'temporary-password',
        'role' => 'waiter',
        'invite_token' => hash('sha256', 'accept-token'),
        'invite_expires_at' => now()->addDay(),
        'invited_at' => now(),
    ]);

    $this->postJson('/api/waiter-invites/accept-token/accept', [
        'password' => 'UjJelszo123!',
        'password_confirmation' => 'UjJelszo123!',
    ])
        ->assertStatus(200)
        ->assertJsonFragment([
            'message' => 'A meghívó aktiválva lett. Most már bejelentkezhetsz.',
        ]);

    $user->refresh();

    expect($user->email_verified_at)->not->toBeNull();
    expect($user->invite_token)->toBeNull();
});

test('admin törölhet pincért', function () {
    /** @var \Tests\TestCase $this */
    $admin = User::where('email', 'admin@test.com')->firstOrFail();
    $waiter = User::where('email', 'waiter2@test.com')->firstOrFail();

    $this->actingAs($admin)
        ->deleteJson("/api/admin/waiters/{$waiter->id}")
        ->assertStatus(204);

    $this->assertDatabaseMissing('users', ['id' => $waiter->id]);
});

test('admin látja az összes asztalt', function () {
    /** @var \Tests\TestCase $this */
    $admin = User::where('email', 'admin@test.com')->firstOrFail();

    $this->actingAs($admin)
        ->getJson('/api/admin/tables')
        ->assertStatus(200)
        ->assertJsonStructure([['id', 'capacity', 'status']]);
});

test('admin létrehozhat új asztalt', function () {
    /** @var \Tests\TestCase $this */
    $admin = User::where('email', 'admin@test.com')->firstOrFail();

    $this->actingAs($admin)
        ->postJson('/api/admin/tables', ['capacity' => 6])
        ->assertStatus(201)
        ->assertJsonFragment(['capacity' => 6]);
});

test('admin módosíthatja egy szabad asztal kapacitását', function () {
    /** @var \Tests\TestCase $this */
    $admin = User::where('email', 'admin@test.com')->firstOrFail();
    $table = Table::where('capacity', 2)->whereDoesntHave('orders')->first();

    $this->actingAs($admin)
        ->putJson("/api/admin/tables/{$table->id}", ['capacity' => 3])
        ->assertStatus(200)
        ->assertJsonFragment(['capacity' => 3]);
});

test('admin törölhet szabad asztalt', function () {
    /** @var \Tests\TestCase $this */
    $admin = User::where('email', 'admin@test.com')->firstOrFail();
    $table = Table::doesntHave('orders')->doesntHave('reservations')->first();

    $this->actingAs($admin)
        ->deleteJson("/api/admin/tables/{$table->id}")
        ->assertStatus(204);

    $this->assertDatabaseMissing('tables', ['id' => $table->id]);
});

test('admin visszaallithat egy foglalt asztalt szabadra', function () {
    /** @var \Tests\TestCase $this */
    $admin = User::where('email', 'admin@test.com')->firstOrFail();
    $table = Table::doesntHave('orders')->doesntHave('reservations')->firstOrFail();

    $reservation = Reservation::create([
        'table_id' => $table->id,
        'guest_name' => 'Reset Teszt',
        'phone_number' => '+36309998877',
        'start_time' => now()->subMinutes(30),
        'end_time' => now()->addMinutes(90),
        'guest_count' => 2,
        'admin_released_at' => null,
    ]);

    $this->actingAs($admin)
        ->postJson("/api/admin/tables/{$table->id}/reset-to-free")
        ->assertStatus(200)
        ->assertJsonFragment([
            'table_id' => $table->id,
            'reservation_id' => $reservation->id,
        ]);

    $this->assertDatabaseHas('reservations', [
        'id' => $reservation->id,
        'table_id' => $table->id,
    ]);

    expect($reservation->fresh()->admin_released_at)->not->toBeNull();
});

test('admin létrehozhat új menükategóriát', function () {
    /** @var \Tests\TestCase $this */
    $admin = User::where('email', 'admin@test.com')->firstOrFail();

    $this->actingAs($admin)
        ->postJson('/api/admin/menu-categories', [
            'name_hu' => 'Leves',
            'name_en' => 'Soup',
        ])
        ->assertStatus(201)
        ->assertJsonFragment(['name_hu' => 'Leves']);
});

test('admin módosíthatja egy menükategória nevét', function () {
    /** @var \Tests\TestCase $this */
    $admin = User::where('email', 'admin@test.com')->firstOrFail();
    $category = MenuCategory::where('name', '!=', MenuCategory::UNAVAILABLE_CATEGORY_NAME)->first();

    $this->actingAs($admin)
        ->putJson("/api/admin/menu-categories/{$category->id}", [
            'name_hu' => 'Módosított kategória',
            'name_en' => 'Modified category',
        ])
        ->assertStatus(200)
        ->assertJsonFragment(['name_hu' => 'Módosított kategória']);
});

test('admin törölhet menükategóriát', function () {
    /** @var \Tests\TestCase $this */
    $admin = User::where('email', 'admin@test.com')->firstOrFail();
    $category = MenuCategory::create([
        'name' => 'Törlendő',
        'name_hu' => 'Törlendő',
        'name_en' => 'ToDelete',
    ]);

    $this->actingAs($admin)
        ->deleteJson("/api/admin/menu-categories/{$category->id}")
        ->assertStatus(204);
});

test('admin lekérheti az összes menüelemet (admin nézetben)', function () {
    /** @var \Tests\TestCase $this */
    $admin = User::where('email', 'admin@test.com')->firstOrFail();

    $this->actingAs($admin)
        ->getJson('/api/admin/menu-items')
        ->assertStatus(200)
        ->assertJsonStructure([['id', 'name', 'price']]);
});

test('admin létrehozhat új menüelemet', function () {
    /** @var \Tests\TestCase $this */
    $admin = User::where('email', 'admin@test.com')->firstOrFail();
    $category = MenuCategory::where('name', '!=', MenuCategory::UNAVAILABLE_CATEGORY_NAME)->first();

    $this->actingAs($admin)
        ->postJson('/api/admin/menu-items', [
            'name_hu' => 'Teszt étel',
            'name_en' => 'Test dish',
            'price' => 1990,
            'category_id' => $category->id,
        ])
        ->assertStatus(201)
        ->assertJsonFragment(['name_hu' => 'Teszt étel']);
});

test('admin módosíthatja egy menüelem árát', function () {
    /** @var \Tests\TestCase $this */
    $admin = User::where('email', 'admin@test.com')->firstOrFail();
    $menuItem = MenuItem::first();

    $this->actingAs($admin)
        ->putJson("/api/admin/menu-items/{$menuItem->id}", ['price' => 9999])
        ->assertStatus(200)
        ->assertJsonFragment(['price' => 9999]);
});

test('admin törölhet menüelemet', function () {
    /** @var \Tests\TestCase $this */
    $admin = User::where('email', 'admin@test.com')->firstOrFail();
    $menuItem = MenuItem::first();

    $this->actingAs($admin)
        ->deleteJson("/api/admin/menu-items/{$menuItem->id}")
        ->assertStatus(204);
});
