<?php

use App\Models\MenuCategory;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Reservation;
use App\Models\Table;
use App\Models\User;

// ─── AUTH ─────────────────────────────────────────────────────
// POST /take-shift
test('pincér felveheti a műszakot', function () {
    /** @var \Tests\TestCase $this */
    $waiter = User::where('email', 'waiter2@test.com')->firstOrFail(); // on_shift=false

    $this->actingAs($waiter)
         ->postJson('/api/take-shift')
         ->assertStatus(200)
         ->assertJsonFragment(['on_shift' => true]);
});

// POST /end-shift
test('pincér leadhatja a műszakot', function () {
    /** @var \Tests\TestCase $this */
    $waiter = User::where('email', 'waiter1@test.com')->firstOrFail(); // on_shift=true

    $this->actingAs($waiter)
         ->postJson('/api/end-shift')
         ->assertStatus(200)
         ->assertJsonFragment(['on_shift' => false]);
});

// PUT /user – email frissítése
test('bejelentkezett felhasználó frissítheti az emailjét', function () {
    /** @var \Tests\TestCase $this */
    $waiter = User::where('email', 'waiter2@test.com')->firstOrFail();

    $this->actingAs($waiter)
         ->putJson('/api/user', ['email' => 'uj-email@test.com'])
         ->assertStatus(200)
         ->assertJsonFragment(['email' => 'uj-email@test.com']);
});

// ─── PUBLIC ───────────────────────────────────────────────────
// GET /menu-categories/{id}
test('publikus: egy konkrét menükategória lekérése sikeres', function () {
    /** @var \Tests\TestCase $this */
    $category = MenuCategory::where('name', '!=', MenuCategory::UNAVAILABLE_CATEGORY_NAME)->first();

    $this->getJson("/api/menu-categories/{$category->id}")
         ->assertStatus(200)
         ->assertJsonFragment(['id' => $category->id]);
});

// ─── RESERVATIONS (waiter) ────────────────────────────────────
// GET /reservations
test('műszakban lévő pincér listázhatja a foglalásokat', function () {
    /** @var \Tests\TestCase $this */
    $waiter = User::where('email', 'waiter1@test.com')->firstOrFail();

    $this->actingAs($waiter)
         ->getJson('/api/reservations')
         ->assertStatus(200)
         ->assertJsonStructure([['id', 'guest_name']]);
});

// GET /reservations/today-with-orders
test('műszakban lévő pincér lekérheti a mai foglalásokat rendelésekkel', function () {
    /** @var \Tests\TestCase $this */
    $waiter = User::where('email', 'waiter1@test.com')->firstOrFail();

    $this->actingAs($waiter)
         ->getJson('/api/reservations/today-with-orders')
         ->assertStatus(200);
});

// GET /reservations/{id}
test('műszakban lévő pincér lekérhet egy foglalást', function () {
    /** @var \Tests\TestCase $this */
    $waiter      = User::where('email', 'waiter1@test.com')->firstOrFail();
    $reservation = Reservation::first();

    $this->actingAs($waiter)
         ->getJson("/api/reservations/{$reservation->id}")
         ->assertStatus(200)
         ->assertJsonFragment(['id' => $reservation->id]);
});

// PUT /reservations/{id} – megjegyzés frissítése
test('műszakban lévő pincér frissítheti a foglalás megjegyzését', function () {
    /** @var \Tests\TestCase $this */
    $waiter = User::where('email', 'waiter1@test.com')->firstOrFail();
    // Jövőbeli foglalást frissítünk (nincs aktív rendelése)
    $reservation = Reservation::where('start_time', '>', now())->first();

    $this->actingAs($waiter)
         ->putJson("/api/reservations/{$reservation->id}", ['note' => 'Teszt megjegyzés'])
         ->assertStatus(200)
         ->assertJsonFragment(['note' => 'Teszt megjegyzés']);
});

// DELETE /reservations/{id}
test('műszakban lévő pincér törölhet foglalást', function () {
    /** @var \Tests\TestCase $this */
    $waiter = User::where('email', 'waiter1@test.com')->firstOrFail();
    $reservation = Reservation::where('start_time', '>', now())->first();

    $this->actingAs($waiter)
         ->deleteJson("/api/reservations/{$reservation->id}")
         ->assertStatus(204);

    $this->assertDatabaseMissing('reservations', ['id' => $reservation->id]);
});

// ─── TABLES (waiter) ──────────────────────────────────────────
// GET /tables/{id}
test('műszakban lévő pincér lekérhet egy asztalt', function () {
    /** @var \Tests\TestCase $this */
    $waiter = User::where('email', 'waiter1@test.com')->firstOrFail();
    $table  = Table::first();

    $this->actingAs($waiter)
         ->getJson("/api/tables/{$table->id}")
         ->assertStatus(200)
         ->assertJsonFragment(['id' => $table->id]);
});

// ─── ORDERS ───────────────────────────────────────────────────
// POST /tables/{table}/orders – rendelés nyitása
test('pincér rendelést nyithat egy foglalással rendelkező asztalnál', function () {
    /** @var \Tests\TestCase $this */
    $waiter = User::where('email', 'waiter1@test.com')->firstOrFail();

    // Az ongoing foglalásokhoz tartozó asztalok egyikén (seederből: tables[5])
    // nézzük az in_progress rendelésű asztalokat – ezekhez már van rendelés,
    // vesszünk inkább egy jövőbeli foglaláshoz tartozó asztalt
    $futureReservation = Reservation::where('start_time', '>', now())
        ->whereDoesntHave('order')
        ->first();

    // Toljuk a start_time-t a múltba, hogy "aktív" legyen
    $futureReservation->start_time = now()->subMinutes(10);
    $futureReservation->end_time   = now()->addMinutes(110);
    $futureReservation->save();

    $this->actingAs($waiter)
         ->postJson("/api/tables/{$futureReservation->table_id}/orders")
         ->assertStatus(201)
         ->assertJsonStructure(['id', 'table_id', 'status']);
});

// POST /orders/{order}/items – tétel hozzáadása
test('pincér tételt adhat egy nyitott rendeléshez', function () {
    /** @var \Tests\TestCase $this */
    $waiter   = User::where('email', 'waiter1@test.com')->firstOrFail();
    $order    = Order::where('status', 'in_progress')->first();
    $menuItem = MenuItem::whereHas('menuCategory', function ($q) {
        $q->where('name', '!=', MenuCategory::UNAVAILABLE_CATEGORY_NAME);
    })->first();

    $this->actingAs($waiter)
         ->postJson("/api/orders/{$order->id}/items", [
             'menu_item_id' => $menuItem->id,
             'quantity'     => 2,
         ])
         ->assertStatus(201)
         ->assertJsonStructure(['item', 'quantity', 'current_total']);
});

// DELETE /orders/{order}/items/{orderItem} – tétel törlése
test('pincér törölhet tételt egy nyitott rendelésből', function () {
    /** @var \Tests\TestCase $this */
    $waiter    = User::where('email', 'waiter1@test.com')->firstOrFail();
    $order     = Order::where('status', 'in_progress')->first();
    $orderItem = OrderItem::where('order_id', $order->id)->first();

    $this->actingAs($waiter)
         ->deleteJson("/api/orders/{$order->id}/items/{$orderItem->id}")
         ->assertStatus(200);
});

// POST /orders/{order}/simulate-ready – fizetésre kész jelzés
test('pincér fizetésre kész státuszba teszi a rendelést', function () {
    /** @var \Tests\TestCase $this */
    $waiter = User::where('email', 'waiter1@test.com')->firstOrFail();
    $order  = Order::where('status', 'in_progress')
                   ->whereHas('orderItems')
                   ->first();

    $this->actingAs($waiter)
         ->postJson("/api/orders/{$order->id}/simulate-ready")
         ->assertStatus(200)
         ->assertJsonFragment(['new_status' => 'ready_to_pay']);
});

// POST /orders/{order}/pay – fizetés
test('pincér lezárhatja a rendelést fizetéssel', function () {
    /** @var \Tests\TestCase $this */
    $waiter = User::where('email', 'waiter1@test.com')->firstOrFail();
    $order  = Order::where('status', 'ready_to_pay')->first();

    $this->actingAs($waiter)
         ->postJson("/api/orders/{$order->id}/pay", [
             'payment_method' => 'cash',
             'tip'            => 500,
         ])
         ->assertStatus(200)
         ->assertJsonFragment(['order_status' => 'done']);
});

// ─── ADMIN – TABLE MANAGEMENT ─────────────────────────────────
// PUT /admin/tables/{id}
test('admin módosíthatja egy szabad asztal kapacitását', function () {
    /** @var \Tests\TestCase $this */
    $admin = User::where('email', 'admin@test.com')->firstOrFail();
    $table = Table::where('capacity', 2)->whereDoesntHave('orders')->first();

    $this->actingAs($admin)
         ->putJson("/api/admin/tables/{$table->id}", ['capacity' => 3])
         ->assertStatus(200)
         ->assertJsonFragment(['capacity' => 3]);
});

// DELETE /admin/tables/{id}
test('admin törölhet szabad asztalt', function () {
    /** @var \Tests\TestCase $this */
    $admin = User::where('email', 'admin@test.com')->firstOrFail();
    // Az utolsó asztalokat a seeder nem foglalja le, vegyük a 11. elemet(index 10)
    $table = Table::doesntHave('orders')->doesntHave('reservations')->first();

    $this->actingAs($admin)
         ->deleteJson("/api/admin/tables/{$table->id}")
         ->assertStatus(204);

    $this->assertDatabaseMissing('tables', ['id' => $table->id]);
});

// ─── ADMIN – MENU CATEGORY ────────────────────────────────────
// POST /admin/menu-categories
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

// PUT /admin/menu-categories/{id}
test('admin módosíthatja egy menükategória nevét', function () {
    /** @var \Tests\TestCase $this */
    $admin    = User::where('email', 'admin@test.com')->firstOrFail();
    $category = MenuCategory::where('name', '!=', MenuCategory::UNAVAILABLE_CATEGORY_NAME)->first();

    $this->actingAs($admin)
         ->putJson("/api/admin/menu-categories/{$category->id}", [
             'name_hu' => 'Módosított kategória',
             'name_en' => 'Modified category',
         ])
         ->assertStatus(200)
         ->assertJsonFragment(['name_hu' => 'Módosított kategória']);
});

// DELETE /admin/menu-categories/{id}
test('admin törölhet menükategóriát', function () {
    /** @var \Tests\TestCase $this */
    $admin    = User::where('email', 'admin@test.com')->firstOrFail();
    $category = MenuCategory::create([
        'name' => 'Törlendő',
        'name_hu' => 'Törlendő',
        'name_en' => 'ToDelete',
    ]);

    $this->actingAs($admin)
         ->deleteJson("/api/admin/menu-categories/{$category->id}")
         ->assertStatus(204);
});

// ─── ADMIN – MENU ITEMS ───────────────────────────────────────
// POST /admin/menu-items
test('admin létrehozhat új menüelemet', function () {
    /** @var \Tests\TestCase $this */
    $admin    = User::where('email', 'admin@test.com')->firstOrFail();
    $category = MenuCategory::where('name', '!=', MenuCategory::UNAVAILABLE_CATEGORY_NAME)->first();

    $this->actingAs($admin)
         ->postJson('/api/admin/menu-items', [
             'name_hu'     => 'Teszt étel',
             'name_en'     => 'Test dish',
             'price'       => 1990,
             'category_id' => $category->id,
         ])
         ->assertStatus(201)
         ->assertJsonFragment(['name_hu' => 'Teszt étel']);
});

// PUT /admin/menu-items/{id}
test('admin módosíthatja egy menüelem árát', function () {
    /** @var \Tests\TestCase $this */
    $admin    = User::where('email', 'admin@test.com')->firstOrFail();
    $menuItem = MenuItem::first();

    $this->actingAs($admin)
         ->putJson("/api/admin/menu-items/{$menuItem->id}", ['price' => 9999])
         ->assertStatus(200)
         ->assertJsonFragment(['price' => 9999]);
});

// DELETE /admin/menu-items/{id}
test('admin törölhet menüelemet', function () {
    /** @var \Tests\TestCase $this */
    $admin    = User::where('email', 'admin@test.com')->firstOrFail();
    $menuItem = MenuItem::first();

    $this->actingAs($admin)
         ->deleteJson("/api/admin/menu-items/{$menuItem->id}")
         ->assertStatus(204);
});

// ─── ADMIN – STATISTICS ───────────────────────────────────────
// GET /admin/daily-revenue
test('admin lekérheti a napi bevételt', function () {
    /** @var \Tests\TestCase $this */
    $admin = User::where('email', 'admin@test.com')->firstOrFail();

    $this->actingAs($admin)
         ->getJson('/api/admin/daily-revenue')
         ->assertStatus(200)
         ->assertJsonStructure(['daily_revenue']);
});

// GET /admin/today-guests
test('admin lekérheti a mai vendégszámot', function () {
    /** @var \Tests\TestCase $this */
    $admin = User::where('email', 'admin@test.com')->firstOrFail();

    $this->actingAs($admin)
         ->getJson('/api/admin/today-guests')
         ->assertStatus(200)
         ->assertJsonStructure(['today_guests']);
});

// GET /admin/guest-count-history
test('admin lekérheti a vendégszám-előzményeket', function () {
    /** @var \Tests\TestCase $this */
    $admin = User::where('email', 'admin@test.com')->firstOrFail();

    $this->actingAs($admin)
         ->getJson('/api/admin/guest-count-history')
         ->assertStatus(200)
         ->assertJsonStructure([['date', 'guest_count']]);
});
