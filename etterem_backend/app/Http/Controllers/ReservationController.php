<?php

namespace App\Http\Controllers;

use App\Models\Reservation;
use App\Models\Table;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Propaganistas\LaravelPhone\Rules\Phone;

class ReservationController extends Controller
{
    public function store(Request $request) {
        $request->validate([
            'guest_name' => 'required|string',
            'phone_number' => ['required', new Phone('HU'), Rule::unique('reservations', 'phone_number')],
            'guest_count' => 'required|integer|min:1',
            'start_time' => 'required|date|after_or_equal:now'
        ]);

        $start = Carbon::parse($request->start_time);

        // CSAK EGESZKOR ES FELKOR LEHET FOGLALNI
        // if (!in_array($start->minute, [0, 30])) {
        //     return response()->json([
        //         'message' => 'Csak egész vagy fél órára lehet foglalni.'
        //     ], 422);
        // }

        $end = $start->copy()->addHours(2);

        $availableTable = Table::where('capacity', '>=', $request->guest_count)
        ->whereDoesntHave('reservations', function ($query) use ($start, $end) {
            $query->where(function ($q) use ($start, $end) {
                $q->whereBetween('start_time', [$start, $end])
                  ->orWhereBetween('end_time', [$start, $end])
                  ->orWhere(function ($sub) use ($start, $end) {
                      $sub->where('start_time', '<=', $start)
                          ->where('end_time', '>=', $end);
                  });
            });
        })
        ->orderBy('capacity', 'asc') // legoptimálisabb
        ->first();

        if (!$availableTable) {
        return response()->json([
            'message' => 'Nincs szabad asztal erre az időpontra.'
            ], 422);
        }

        $reservation = Reservation::create([
            'table_id' => $availableTable->id,
            'guest_name' => $request->guest_name,
            'phone_number' => $request->phone_number,
            'guest_count' => $request->guest_count,
            'start_time' => $start,
            'end_time' => $end,
        ]);

        return response()->json($reservation->load('table'), 201);
    }
}
