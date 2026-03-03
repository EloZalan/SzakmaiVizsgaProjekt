<?php
namespace App\Services;

use App\Models\Table;
use Carbon\Carbon;

class ReservationService
{
    public function findAvailableTable(Carbon $requestedTime, int $guestCount)
    {
        // A foglalás fixen 2 órás idősávra szól
        $reservationStart = $requestedTime->copy();
        $reservationEnd = $requestedTime->copy()->addHours(2);

        return Table::where('capacity', '>=', $guestCount)
            // Ne legyen rajta aktív (nem done) rendelés
            ->whereDoesntHave('orders', function ($query) {
                $query->where('status', '!=', 'done');
            })
            // Ne legyen rajta olyan foglalás, amelyik átfedi az új foglalás 2 órás idősávját,
            // és amelyhez nincs done rendelés (tehát a vendég még nem "ment el").
            ->whereDoesntHave('reservations', function ($query) use ($reservationStart, $reservationEnd) {
                $query
                    // időintervallum átfedés ellenőrzése
                    ->where('start_time', '<', $reservationEnd)
                    ->where('end_time', '>', $reservationStart)
                    ->whereDoesntHave('order', function ($q) {
                        $q->where('status', 'done');
                    });
            })
            ->orderBy('capacity', 'asc')
            ->first();
    }

}
