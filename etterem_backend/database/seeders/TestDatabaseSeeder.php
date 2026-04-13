<?php

namespace Database\Seeders;

use App\Models\MenuCategory;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\Reservation;
use App\Models\Table;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * Deterministic, image-free seeder used exclusively in automated tests.
 *
 * Eredmény:
 *  - 1 admin  (admin@test.com / password)
 *  - 3 pincér (waiter1-3@test.com / password), waiter1 épp műszakban van
 *  - 12 asztal
 *  - 4 menükategória + 6 ételitem (kép nélkül)
 *  - 5 lezárt múltbeli foglalás  → done rendelés + payment
 *  - 3 éppen zajló foglalás      → in_progress rendelés (1 db ready_to_pay-ként)
 *  - 3 jövőbeli foglalás         → nincs rendelés
 */
class TestDatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ── Felhasználók ──────────────────────────────────────────────
        $admin = User::create([
            'name'     => 'Admin Tesztelő',
            'email'    => 'admin@test.com',
            'password' => Hash::make('password'),
            'role'     => 'admin',
            'email_verified_at' => now(),
        ]);

        $waiter1 = User::create([
            'name'     => 'Pincér Egy',
            'email'    => 'waiter1@test.com',
            'password' => Hash::make('password'),
            'role'     => 'waiter',
            'on_shift' => true,
            'email_verified_at' => now(),
        ]);

        $waiter2 = User::create([
            'name'     => 'Pincér Kettő',
            'email'    => 'waiter2@test.com',
            'password' => Hash::make('password'),
            'role'     => 'waiter',
            'on_shift' => false,
            'email_verified_at' => now(),
        ]);

        $waiter3 = User::create([
            'name'     => 'Pincér Három',
            'email'    => 'waiter3@test.com',
            'password' => Hash::make('password'),
            'role'     => 'waiter',
            'on_shift' => false,
            'email_verified_at' => now(),
        ]);

        // ── Asztalok ──────────────────────────────────────────────────
        // 6 db 4 személyes, 4 db 2 személyes, 1 db 6 személyes, 1 db 5 személyes
        $tables = [];
        for ($i = 1; $i <= 6; $i++) {
            $tables[] = Table::create(['capacity' => 4]);
        }
        for ($i = 1; $i <= 4; $i++) {
            $tables[] = Table::create(['capacity' => 2]);
        }
        $tables[] = Table::create(['capacity' => 6]);
        $tables[] = Table::create(['capacity' => 5]);

        // ── Menükategóriák ────────────────────────────────────────────
        $catMain    = MenuCategory::create(['name' => 'Főétel',   'name_hu' => 'Főétel',   'name_en' => 'Main dish']);
        $catSide    = MenuCategory::create(['name' => 'Köret',    'name_hu' => 'Köret',    'name_en' => 'Side dish']);
        $catDessert = MenuCategory::create(['name' => 'Desszert', 'name_hu' => 'Desszert', 'name_en' => 'Dessert']);
        $catDrink   = MenuCategory::create(['name' => 'Ital',     'name_hu' => 'Ital',     'name_en' => 'Drink']);

        // ── Ételek (kép nélkül) ───────────────────────────────────────
        $ribEye = MenuItem::create([
            'name' => 'Rib-eye steak', 'name_hu' => 'Rib-eye steak', 'name_en' => 'Rib-eye steak',
            'description' => 'Szaftos marha steak (200g)',
            'description_hu' => 'Szaftos marha steak (200g)',
            'description_en' => 'Juicy beef steak (200g)',
            'price' => 8500,
            'category_id' => $catMain->id,
        ]);
        $chicken = MenuItem::create([
            'name' => 'Csirkemell', 'name_hu' => 'Csirkemell', 'name_en' => 'Chicken breast',
            'description' => 'Grillezett csirkemell (180g)',
            'description_hu' => 'Grillezett csirkemell (180g)',
            'description_en' => 'Grilled chicken breast (180g)',
            'price' => 4900,
            'category_id' => $catMain->id,
        ]);
        MenuItem::create([
            'name' => 'Sertésszűz', 'name_hu' => 'Sertésszűz', 'name_en' => 'Pork tenderloin',
            'description' => 'Fokhagymás sertésszűz (200g)',
            'description_hu' => 'Fokhagymás sertésszűz (200g)',
            'description_en' => 'Garlic pork tenderloin (200g)',
            'price' => 5200,
            'category_id' => $catMain->id,
        ]);
        MenuItem::create([
            'name' => 'Lazacfilé', 'name_hu' => 'Lazacfilé', 'name_en' => 'Salmon fillet',
            'description' => 'Citromos lazacfilé (180g)',
            'description_hu' => 'Citromos lazacfilé (180g)',
            'description_en' => 'Lemon salmon fillet (180g)',
            'price' => 6900,
            'category_id' => $catMain->id,
        ]);
        MenuItem::create([
            'name' => 'Marhaburger', 'name_hu' => 'Marhaburger', 'name_en' => 'Beef burger',
            'description' => 'Szaftos marhaburger kézműves buciban',
            'description_hu' => 'Szaftos marhaburger kézműves buciban',
            'description_en' => 'Juicy beef burger in artisan bun',
            'price' => 3900,
            'category_id' => $catMain->id,
        ]);
        $fries = MenuItem::create([
            'name' => 'Sült krumpli', 'name_hu' => 'Sült krumpli', 'name_en' => 'French fries',
            'description' => '(150g)',
            'description_hu' => '(150g)',
            'description_en' => '(150g)',
            'price' => 890,
            'category_id' => $catSide->id,
        ]);
        MenuItem::create([
            'name' => 'Édesburgonya', 'name_hu' => 'Édesburgonya', 'name_en' => 'Sweet potato fries',
            'description' => 'Ropogós édesburgonya hasábok (150g)',
            'description_hu' => 'Ropogós édesburgonya hasábok (150g)',
            'description_en' => 'Crispy sweet potato fries (150g)',
            'price' => 1290,
            'category_id' => $catSide->id,
        ]);
        MenuItem::create([
            'name' => 'Grillezett zöldség', 'name_hu' => 'Grillezett zöldség', 'name_en' => 'Grilled vegetables',
            'description' => 'Szezonális zöldségek grillen (160g)',
            'description_hu' => 'Szezonális zöldségek grillen (160g)',
            'description_en' => 'Seasonal grilled vegetables (160g)',
            'price' => 1490,
            'category_id' => $catSide->id,
        ]);
        MenuItem::create([
            'name' => 'Jázmin rizs', 'name_hu' => 'Jázmin rizs', 'name_en' => 'Jasmine rice',
            'description' => 'Párolt jázmin rizs (180g)',
            'description_hu' => 'Párolt jázmin rizs (180g)',
            'description_en' => 'Steamed jasmine rice (180g)',
            'price' => 790,
            'category_id' => $catSide->id,
        ]);
        MenuItem::create([
            'name' => 'Steak burgonya', 'name_hu' => 'Steak burgonya', 'name_en' => 'Steak potatoes',
            'description' => 'Fűszeres steak burgonya (170g)',
            'description_hu' => 'Fűszeres steak burgonya (170g)',
            'description_en' => 'Seasoned steak potatoes (170g)',
            'price' => 1090,
            'category_id' => $catSide->id,
        ]);
        $tiramisu = MenuItem::create([
            'name' => 'Tiramisu', 'name_hu' => 'Tiramisu', 'name_en' => 'Tiramisu',
            'description' => 'Olasz módra (150g)',
            'description_hu' => 'Olasz módra (150g)',
            'description_en' => 'Italian style (150g)',
            'price' => 2190,
            'category_id' => $catDessert->id,
        ]);
        MenuItem::create([
            'name' => 'Sajttorta', 'name_hu' => 'Sajttorta', 'name_en' => 'Cheesecake',
            'description' => 'Krémes sajttorta gyümölcsraguval',
            'description_hu' => 'Krémes sajttorta gyümölcsraguval',
            'description_en' => 'Creamy cheesecake with fruit coulis',
            'price' => 1990,
            'category_id' => $catDessert->id,
        ]);
        MenuItem::create([
            'name' => 'Brownie', 'name_hu' => 'Brownie', 'name_en' => 'Brownie',
            'description' => 'Csokoládés brownie vaníliafagyival',
            'description_hu' => 'Csokoládés brownie vaníliafagyival',
            'description_en' => 'Chocolate brownie with vanilla ice cream',
            'price' => 1890,
            'category_id' => $catDessert->id,
        ]);
        MenuItem::create([
            'name' => 'Almás pite', 'name_hu' => 'Almás pite', 'name_en' => 'Apple pie',
            'description' => 'Házi almás pite fahéjjal',
            'description_hu' => 'Házi almás pite fahéjjal',
            'description_en' => 'Homemade apple pie with cinnamon',
            'price' => 1690,
            'category_id' => $catDessert->id,
        ]);
        MenuItem::create([
            'name' => 'Somlói galuska', 'name_hu' => 'Somlói galuska', 'name_en' => 'Hungarian trifle',
            'description' => 'Klasszikus somlói galuska',
            'description_hu' => 'Klasszikus somlói galuska',
            'description_en' => 'Classic Hungarian trifle',
            'price' => 1790,
            'category_id' => $catDessert->id,
        ]);
        $cola = MenuItem::create([
            'name' => 'Coca Cola', 'name_hu' => 'Coca Cola', 'name_en' => 'Coca Cola',
            'description' => 'Az igazi (250ml)',
            'description_hu' => 'Az igazi (250ml)',
            'description_en' => 'The real one (250ml)',
            'price' => 550,
            'category_id' => $catDrink->id,
        ]);
        $water = MenuItem::create([
            'name' => 'Ásványvíz', 'name_hu' => 'Ásványvíz', 'name_en' => 'Mineral water',
            'description' => '(500ml)',
            'description_hu' => '(500ml)',
            'description_en' => '(500ml)',
            'price' => 390,
            'category_id' => $catDrink->id,
        ]);
        MenuItem::create([
            'name' => 'Limonádé', 'name_hu' => 'Limonádé', 'name_en' => 'Lemonade',
            'description' => 'Friss citromos limonádé (400ml)',
            'description_hu' => 'Friss citromos limonádé (400ml)',
            'description_en' => 'Fresh lemonade (400ml)',
            'price' => 990,
            'category_id' => $catDrink->id,
        ]);
        MenuItem::create([
            'name' => 'Narancslé', 'name_hu' => 'Narancslé', 'name_en' => 'Orange juice',
            'description' => '100% narancslé (300ml)',
            'description_hu' => '100% narancslé (300ml)',
            'description_en' => '100% orange juice (300ml)',
            'price' => 890,
            'category_id' => $catDrink->id,
        ]);
        MenuItem::create([
            'name' => 'Jeges tea', 'name_hu' => 'Jeges tea', 'name_en' => 'Iced tea',
            'description' => 'Barackos jeges tea (400ml)',
            'description_hu' => 'Barackos jeges tea (400ml)',
            'description_en' => 'Peach iced tea (400ml)',
            'price' => 790,
            'category_id' => $catDrink->id,
        ]);

        // ── Lezárt múltbeli foglalások (done rendeléssel + kifizetéssel) ──
        $pastReservations = [
            ['table' => $tables[0], 'waiter' => $waiter1, 'days_ago' => 3, 'guests' => 2,
             'items' => [[$ribEye, 2], [$cola, 2]]],
            ['table' => $tables[1], 'waiter' => $waiter2, 'days_ago' => 2, 'guests' => 4,
             'items' => [[$chicken, 4], [$fries, 4], [$cola, 3], [$tiramisu, 2]]],
            ['table' => $tables[2], 'waiter' => $waiter1, 'days_ago' => 1, 'guests' => 3,
             'items' => [[$ribEye, 1], [$chicken, 2], [$water, 3]]],
            ['table' => $tables[3], 'waiter' => $waiter3, 'days_ago' => 1, 'guests' => 2,
             'items' => [[$chicken, 2], [$fries, 2], [$cola, 2], [$tiramisu, 1]]],
            ['table' => $tables[4], 'waiter' => $waiter2, 'days_ago' => 5, 'guests' => 6,
             'items' => [[$ribEye, 3], [$chicken, 3], [$fries, 6], [$cola, 6], [$tiramisu, 3]]],
        ];

        foreach ($pastReservations as $data) {
            $start = now()->subDays($data['days_ago'])->setTime(19, 0);
            $end   = $start->copy()->addHours(2);

            $reservation = Reservation::create([
                'table_id'    => $data['table']->id,
                'guest_name'  => 'Teszt Vendég',
                'phone_number' => '+36301234567',
                'start_time'  => $start,
                'end_time'    => $end,
                'guest_count' => $data['guests'],
            ]);

            $total = 0;
            $order = Order::create([
                'table_id'       => $data['table']->id,
                'waiter_id'      => $data['waiter']->id,
                'reservation_id' => $reservation->id,
                'total_price'    => 0,
                'status'         => 'done',
            ]);

            foreach ($data['items'] as [$item, $qty]) {
                OrderItem::create([
                    'order_id'     => $order->id,
                    'menu_item_id' => $item->id,
                    'quantity'     => $qty,
                ]);
                $total += $item->price * $qty;
            }

            $order->update(['total_price' => $total]);

            Payment::create([
                'order_id'       => $order->id,
                'amount'         => $total,
                'payment_method' => 'cash',
                'paid_at'        => $end,
            ]);
        }

        // ── Éppen zajló foglalások (in_progress rendeléssel) ──────────
        $ongoingReservations = [
            // Asztal 6 – in_progress (foglalt asztal)
            ['table' => $tables[5], 'waiter' => $waiter1, 'guests' => 3, 'status' => 'in_progress',
             'items' => [[$chicken, 3], [$water, 3]]],
            // Asztal 7 – in_progress
            ['table' => $tables[6], 'waiter' => $waiter1, 'guests' => 2, 'status' => 'in_progress',
             'items' => [[$ribEye, 2], [$cola, 2]]],
            // Asztal 8 – ready_to_pay (fizetésre vár)
            ['table' => $tables[7], 'waiter' => $waiter1, 'guests' => 4, 'status' => 'ready_to_pay',
             'items' => [[$chicken, 4], [$fries, 4], [$cola, 4], [$tiramisu, 2]]],
        ];

        foreach ($ongoingReservations as $data) {
            $start = now()->subHour();
            $end   = now()->addHour();

            $reservation = Reservation::create([
                'table_id'    => $data['table']->id,
                'guest_name'  => 'Folyamatban Vendég',
                'phone_number' => '+36301234567',
                'start_time'  => $start,
                'end_time'    => $end,
                'guest_count' => $data['guests'],
            ]);

            $total = 0;
            $order = Order::create([
                'table_id'       => $data['table']->id,
                'waiter_id'      => $data['waiter']->id,
                'reservation_id' => $reservation->id,
                'total_price'    => 0,
                'status'         => $data['status'],
            ]);

            foreach ($data['items'] as [$item, $qty]) {
                OrderItem::create([
                    'order_id'     => $order->id,
                    'menu_item_id' => $item->id,
                    'quantity'     => $qty,
                ]);
                $total += $item->price * $qty;
            }

            $order->update(['total_price' => $total]);
        }

        // ── Jövőbeli foglalások (nincs rendelés) ──────────────────────
        $futureReservations = [
            ['table' => $tables[8],  'guests' => 2, 'hours_from_now' => 3],
            ['table' => $tables[9],  'guests' => 4, 'hours_from_now' => 5],
            ['table' => $tables[10], 'guests' => 6, 'hours_from_now' => 8],
        ];

        foreach ($futureReservations as $data) {
            $start = now()->addHours($data['hours_from_now']);
            $end   = $start->copy()->addHours(2);

            Reservation::create([
                'table_id'    => $data['table']->id,
                'guest_name'  => 'Jövő Vendég',
                'phone_number' => '+36701234567',
                'start_time'  => $start,
                'end_time'    => $end,
                'guest_count' => $data['guests'],
            ]);
        }
    }
}
