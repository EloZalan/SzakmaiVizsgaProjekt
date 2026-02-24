<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Reservation;
use App\Models\Table;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class OrderController extends Controller
{
    public function openOrder(Request $request, Table $table)
    {
        $now = Carbon::now();

        // 1. Ellenőrizzük, van-e aktív foglalás az asztalnál MOST
        // (A $table->id-t használjuk, amit a Laravel automatikusan betöltött az URL-ből)
        $activeReservation = Reservation::where('table_id', $table->id)
            ->where('start_time', '<=', $now)
            ->where('end_time', '>=', $now)
            ->first();

        if (!$activeReservation) {
            return response()->json([
                'message' => 'Ezen az asztalon jelenleg nincs érvényes foglalás.'
            ], 400);
        }

        // 2. Ellenőrizzük, van-e már FUTÓ (nem lezárt) rendelés az asztalon
        // Minden státusz, ami NEM 'done', aktív folyamatot jelent.
        $existingOrder = Order::where('table_id', $table->id)
            ->where('status', '!=', 'done')
            ->first();

        if ($existingOrder) {
            return response()->json([
                'message' => 'Az asztalon már van egy aktív rendelés!',
                'current_status' => $existingOrder->status
            ], 400);
        }

        // 3. Rendelés létrehozása
        // Auth::id()-t használunk, hogy az Intelephense ne húzza alá pirossal
        $order = Order::create([
            'table_id' => $table->id,
            'waiter_id' => Auth::id(),
            'total_price' => 0,
            'status' => 'waiting_for_service' // Alapértelmezett kezdő státusz
        ]);

        return response()->json([
            'message' => 'Rendelés sikeresen megnyitva!',
            'order' => $order,
            'guest_details' => [
                'name' => $activeReservation->guest_name,
                'phone' => $activeReservation->phone_number
            ]
        ], 201);
    }
}
