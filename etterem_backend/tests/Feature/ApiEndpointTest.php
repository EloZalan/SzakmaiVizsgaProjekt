<?php

use App\Models\MenuCategory;
use App\Models\MenuItem;
use App\Models\Table;
use App\Models\User;

// ─────────────────────────────────────────────────────────────
// 1. AUTH – POST /api/login  (sikeres)
// ─────────────────────────────────────────────────────────────
test('sikeres bejelentkezés tokent ad vissza', function () {
    /** @var \Tests\TestCase $this */
    $response = $this->postJson('/api/login', [
        'email'    => 'admin@test.com',
        'password' => 'password',
    ]);

    $response->assertStatus(200)
             ->assertJsonStructure(['token', 'user']);
});

// ─────────────────────────────────────────────────────────────
// 2. AUTH – POST /api/login  (hibás jelszó)
// ─────────────────────────────────────────────────────────────
test('hibás jelszóval 401-es választ kap', function () {
    /** @var \Tests\TestCase $this */
    $response = $this->postJson('/api/login', [
        'email'    => 'admin@test.com',
        'password' => 'rossz_jelszo',
    ]);

    $response->assertStatus(401);
});

// ─────────────────────────────────────────────────────────────
// 3. AUTH – GET /api/user  (bejelentkezve)
// ─────────────────────────────────────────────────────────────
test('bejelentkezett felhasználó lekérheti saját adatait', function () {
    /** @var \Tests\TestCase $this */
    $admin = User::where('email', 'admin@test.com')->firstOrFail();

    $this->actingAs($admin)
         ->getJson('/api/user')
         ->assertStatus(200)
         ->assertJsonFragment(['email' => 'admin@test.com']);
});

// ─────────────────────────────────────────────────────────────
// 4. AUTH – GET /api/user  (nem bejelentkezve)
// ─────────────────────────────────────────────────────────────
test('nem bejelentkezett felhasználó 401-est kap a /user végponton', function () {
    /** @var \Tests\TestCase $this */
    $this->getJson('/api/user')
         ->assertStatus(401);
});

// ─────────────────────────────────────────────────────────────
// 5. AUTH – POST /api/logout
// ─────────────────────────────────────────────────────────────
test('kijelentkezés sikeresen visszavonja a tokent', function () {
    /** @var \Tests\TestCase $this */
    $waiter = User::where('email', 'waiter1@test.com')->firstOrFail();
    $token  = $waiter->createToken('test')->plainTextToken;

    $this->withHeader('Authorization', "Bearer {$token}")
         ->postJson('/api/logout')
         ->assertStatus(200);
});

// ─────────────────────────────────────────────────────────────
// 6. PUBLIC – GET /api/menu-items
// ─────────────────────────────────────────────────────────────
test('publikus menülista visszaadja az ételeket', function () {
    /** @var \Tests\TestCase $this */
    $response = $this->getJson('/api/menu-items');

    $response->assertStatus(200)
             ->assertJsonStructure([['id', 'name', 'price']]);
});

// ─────────────────────────────────────────────────────────────
// 7. PUBLIC – GET /api/menu-items/{id}
// ─────────────────────────────────────────────────────────────
test('egy konkrét ételelem lekérése sikeres', function () {
    /** @var \Tests\TestCase $this */
    $item = MenuItem::first();

    $this->getJson("/api/menu-items/{$item->id}")
         ->assertStatus(200)
         ->assertJsonFragment(['id' => $item->id]);
});

// ─────────────────────────────────────────────────────────────
// 8. PUBLIC – GET /api/menu-categories
// ─────────────────────────────────────────────────────────────
test('publikus menükategória-lista visszaadja a kategóriákat', function () {
    /** @var \Tests\TestCase $this */
    $response = $this->getJson('/api/menu-categories');

    $response->assertStatus(200)
             ->assertJsonStructure([['id', 'name']]);
});

// ─────────────────────────────────────────────────────────────
// 9. PUBLIC – GET /api/tables/max-capacity
// ─────────────────────────────────────────────────────────────
test('max kapacitás végpont visszaadja a legnagyobb asztal méretét', function () {
    /** @var \Tests\TestCase $this */
    $response = $this->getJson('/api/tables/max-capacity');

    $response->assertStatus(200)
             ->assertJsonStructure(['max_capacity']);

    $this->assertGreaterThan(0, $response->json('max_capacity'));
});

// ─────────────────────────────────────────────────────────────
// 10. PUBLIC – POST /api/reservations  (sikeres)
// ─────────────────────────────────────────────────────────────
test('vendég sikeresen foglalhat asztalt', function () {
    /** @var \Tests\TestCase $this */
    $response = $this->postJson('/api/reservations', [
        'guest_name'  => 'Kiss János',
        'phone_number' => '+36201234567',
        'guest_count' => 2,
        'start_time'  => now()->addDays(3)->toIso8601String(),
    ]);

    $response->assertStatus(201)
             ->assertJsonFragment(['guest_name' => 'Kiss János']);
});

// ─────────────────────────────────────────────────────────────
// 11. WAITER – GET /api/tables  (műszakban lévő pincér)
// ─────────────────────────────────────────────────────────────
test('műszakban lévő pincér látja az asztalokat', function () {
    /** @var \Tests\TestCase $this */
    $waiter = User::where('email', 'waiter1@test.com')->firstOrFail(); // on_shift = true

    $this->actingAs($waiter)
         ->getJson('/api/tables')
         ->assertStatus(200)
         ->assertJsonStructure([['id', 'capacity', 'status']]);
});

// ─────────────────────────────────────────────────────────────
// 12. WAITER – GET /api/tables  (nem műszakban lévő pincér)
// ─────────────────────────────────────────────────────────────
test('nem műszakban lévő pincér 403-at kap az asztaloknál', function () {
    /** @var \Tests\TestCase $this */
    $waiter = User::where('email', 'waiter2@test.com')->firstOrFail(); // on_shift = false

    $this->actingAs($waiter)
         ->getJson('/api/tables')
         ->assertStatus(403);
});

// ─────────────────────────────────────────────────────────────
// 13. WAITER – POST /api/reservations/walk-in
// ─────────────────────────────────────────────────────────────
test('pincér helyszíni foglalást hozhat létre', function () {
    /** @var \Tests\TestCase $this */
    $waiter = User::where('email', 'waiter1@test.com')->firstOrFail();

    $this->actingAs($waiter)
         ->postJson('/api/reservations/walk-in', ['guest_count' => 2])
         ->assertStatus(201)
         ->assertJsonFragment(['guest_name' => 'Helyszíni vendég']);
});

// ─────────────────────────────────────────────────────────────
// 14. ADMIN – GET /api/admin/waiters
// ─────────────────────────────────────────────────────────────
test('admin listázhatja a pincéreket', function () {
    /** @var \Tests\TestCase $this */
    $admin = User::where('email', 'admin@test.com')->firstOrFail();

    $this->actingAs($admin)
         ->getJson('/api/admin/waiters')
         ->assertStatus(200)
         ->assertJsonStructure([['id', 'name', 'email', 'role', 'on_shift']]);
});

// ─────────────────────────────────────────────────────────────
// 15. ADMIN – GET /api/admin/waiters  (pincér nem férhet hozzá)
// ─────────────────────────────────────────────────────────────
test('pincér nem listázhatja az admin pincér-listát', function () {
    /** @var \Tests\TestCase $this */
    $waiter = User::where('email', 'waiter1@test.com')->firstOrFail();

    $this->actingAs($waiter)
         ->getJson('/api/admin/waiters')
         ->assertStatus(403);
});

// ─────────────────────────────────────────────────────────────
// 16. ADMIN – POST /api/admin/waiters
// ─────────────────────────────────────────────────────────────
test('admin hozzáadhat új pincért', function () {
    /** @var \Tests\TestCase $this */
    $admin = User::where('email', 'admin@test.com')->firstOrFail();

    $this->actingAs($admin)
         ->postJson('/api/admin/waiters', [
             'name'                  => 'Új Pincér',
             'email'                 => 'ujpincer@test.com',
             'password'              => 'Jelszo123!',
             'password_confirmation' => 'Jelszo123!',
         ])
         ->assertStatus(201)
         ->assertJsonFragment(['email' => 'ujpincer@test.com']);
});

// ─────────────────────────────────────────────────────────────
// 17. ADMIN – DELETE /api/admin/waiters/{id}
// ─────────────────────────────────────────────────────────────
test('admin törölhet pincért', function () {
    /** @var \Tests\TestCase $this */
    $admin  = User::where('email', 'admin@test.com')->firstOrFail();
    $waiter = User::where('email', 'waiter2@test.com')->firstOrFail();

    $this->actingAs($admin)
         ->deleteJson("/api/admin/waiters/{$waiter->id}")
         ->assertStatus(204);

    $this->assertDatabaseMissing('users', ['id' => $waiter->id]);
});

// ─────────────────────────────────────────────────────────────
// 18. ADMIN – GET /api/admin/tables
// ─────────────────────────────────────────────────────────────
test('admin látja az összes asztalt', function () {
    /** @var \Tests\TestCase $this */
    $admin = User::where('email', 'admin@test.com')->firstOrFail();

    $this->actingAs($admin)
         ->getJson('/api/admin/tables')
         ->assertStatus(200)
         ->assertJsonStructure([['id', 'capacity', 'status']]);
});

// ─────────────────────────────────────────────────────────────
// 19. ADMIN – POST /api/admin/tables
// ─────────────────────────────────────────────────────────────
test('admin létrehozhat új asztalt', function () {
    /** @var \Tests\TestCase $this */
    $admin = User::where('email', 'admin@test.com')->firstOrFail();

    $this->actingAs($admin)
         ->postJson('/api/admin/tables', ['capacity' => 6])
         ->assertStatus(201)
         ->assertJsonFragment(['capacity' => 6]);
});

// ─────────────────────────────────────────────────────────────
// 20. ADMIN – GET /api/admin/menu-items
// ─────────────────────────────────────────────────────────────
test('admin lekérheti az összes menüelemet (admin nézetben)', function () {
    /** @var \Tests\TestCase $this */
    $admin = User::where('email', 'admin@test.com')->firstOrFail();

    $this->actingAs($admin)
         ->getJson('/api/admin/menu-items')
         ->assertStatus(200)
         ->assertJsonStructure([['id', 'name', 'price']]);
});
