<?php

namespace App\Http\Controllers;

use App\Models\Reservation;
use App\Models\Table;
use App\Services\ReservationService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Propaganistas\LaravelPhone\Rules\Phone;

class ReservationController extends Controller
{

    protected $reservationService;

    public function __construct(ReservationService $service) {
        $this->reservationService = $service;
    }

    public function store(Request $request) {
        $request->validate([
            'guest_name' => 'required|string',
            'phone_number' => ['required', new Phone('HU'), Rule::unique('reservations', 'phone_number')],
            'guest_count' => 'required|integer|min:1',
            'start_time' => 'required|date|after_or_equal:now'
        ]);

        $startTime = Carbon::parse($request->start_time);
        $endTime = $startTime->copy()->addHours(2);

        $table = $this->reservationService->findAvailableTable(
            $startTime,
            $request->guest_count
        );

        if (!$table) {
            return response()->json(['message' => 'Sajnos nincs szabad asztal ebben az időpontban.'], 422);
        }

        $reservation = Reservation::create([
            'table_id' => $table->id,
            'guest_name' => $request->guest_name,
            'phone_number' => $request->phone_number,
            'start_time' => $startTime,
            'end_time' => $endTime,
            'guest_count' => $request->guest_count,
        ]);

        return response()->json([
            'message' => 'Sikeres foglalás!',
            'table_number' => $table->id,
            'reservation' => $reservation
        ]);
    }
}
