<?php

namespace Database\Seeders;

use App\Models\MenuItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Reservation;
use App\Models\Table;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class ReservationSeeder extends Seeder
{
    public function run(): void
    {
        $tables   = Table::all();
        $waiters  = User::where('role', 'waiter')->pluck('id')->toArray();
        $menuItems = MenuItem::all();

        if ($tables->isEmpty() || empty($waiters) || $menuItems->isEmpty()) {
            return;
        }

        $tableCount = $tables->count();

        // Realistic daily guest totals for the past 10 days (weekday ~60-90, weekend ~110-150)
        $guestsByDay = [63, 78, 57, 124, 138, 91, 72, 85, 68, 112];

        // Named time slots — lunch and dinner service
        $slots = [
            ['start' => 11, 'end' => 13],
            ['start' => 12, 'end' => 14],
            ['start' => 13, 'end' => 15],
            ['start' => 18, 'end' => 20],
            ['start' => 19, 'end' => 21],
            ['start' => 20, 'end' => 22],
        ];

        // Hungarian first/last name pools for realistic names
        $firstNames = ['Kovács', 'Nagy', 'Tóth', 'Szabó', 'Horváth', 'Varga', 'Kiss', 'Molnár', 'Németh', 'Farkas'];
        $lastNames  = ['Péter', 'Anna', 'László', 'Katalin', 'Zoltán', 'Éva', 'Tamás', 'Ágnes', 'Gábor', 'Erzsébet'];
        $phones     = ['+36301234567', '+36701234567', '+36201234567', '+36309876543', '+36709876543'];

        $tableIndex = 0;

        foreach ($guestsByDay as $dayOffset => $targetGuests) {
            // dayOffset 0 = 10 days ago, 9 = yesterday
            $day       = now()->subDays(10 - $dayOffset)->startOfDay();
            $remaining = $targetGuests;

            while ($remaining > 0) {
                $guestCount = min($remaining, rand(2, 6));
                $slot       = $slots[array_rand($slots)];
                $startMin   = rand(0, 29);
                $start      = $day->copy()->addHours($slot['start'])->addMinutes($startMin);
                $end        = $day->copy()->addHours($slot['end'])->addMinutes($startMin);
                $table      = $tables[$tableIndex % $tableCount];
                $waiterId   = $waiters[array_rand($waiters)];

                $guestName = $firstNames[array_rand($firstNames)] . ' ' . $lastNames[array_rand($lastNames)];

                $reservation = Reservation::create([
                    'table_id'    => $table->id,
                    'guest_name'  => $guestName,
                    'phone_number' => $phones[array_rand($phones)],
                    'start_time'  => $start,
                    'end_time'    => $end,
                    'guest_count' => $guestCount,
                    'note'        => null,
                ]);

                // Calculate total from actual order items
                $orderItems = [];
                $total = 0;

                // Each guest orders a main course
                $mains = $menuItems->where('category_id', 1);
                for ($i = 0; $i < $guestCount; $i++) {
                    $item = $mains->isNotEmpty() ? $mains->random() : $menuItems->random();
                    $qty  = 1;
                    $orderItems[] = ['menu_item_id' => $item->id, 'quantity' => $qty];
                    $total += $item->price * $qty;
                }

                // ~70% chance each guest orders a drink
                $drinks = $menuItems->where('category_id', 4);
                if ($drinks->isNotEmpty()) {
                    for ($i = 0; $i < $guestCount; $i++) {
                        if (rand(1, 10) <= 7) {
                            $item = $drinks->random();
                            $qty  = rand(1, 2);
                            $orderItems[] = ['menu_item_id' => $item->id, 'quantity' => $qty];
                            $total += $item->price * $qty;
                        }
                    }
                }

                // ~40% chance the table orders dessert
                $desserts = $menuItems->where('category_id', 3);
                if ($desserts->isNotEmpty() && rand(1, 10) <= 4) {
                    $item = $desserts->random();
                    $qty  = rand(1, $guestCount);
                    $orderItems[] = ['menu_item_id' => $item->id, 'quantity' => $qty];
                    $total += $item->price * $qty;
                }

                $order = Order::create([
                    'table_id'       => $table->id,
                    'waiter_id'      => $waiterId,
                    'reservation_id' => $reservation->id,
                    'total_price'    => $total,
                    'status'         => 'done',
                ]);

                foreach ($orderItems as $oi) {
                    OrderItem::create([
                        'order_id'     => $order->id,
                        'menu_item_id' => $oi['menu_item_id'],
                        'quantity'     => $oi['quantity'],
                    ]);
                }

                $remaining   -= $guestCount;
                $tableIndex++;
            }
        }
    }
}
