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

    public function index()
    {
        return response()->json(Reservation::all());
    }

    public function show(Reservation $reservation)
    {
        return response()->json($reservation);
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

        return response()->json($reservation, 201);
    }

    public function storeWalkIn(Request $request)
    {
        $request->validate([
            'guest_count' => 'required|integer|min:1',
        ]);

        $startTime = Carbon::now();
        $endTime = $startTime->copy()->addHours(2);

        $table = $this->reservationService->findAvailableTable(
            $startTime,
            $request->guest_count
        );

        if (!$table) {
            return response()->json(['message' => 'Sajnos nincs szabad asztal jelenleg.'], 422);
        }

        $reservation = Reservation::create([
            'table_id' => $table->id,
            'guest_name' => 'Walk-in guest',
            'phone_number' => null,
            'start_time' => $startTime,
            'end_time' => $endTime,
            'guest_count' => $request->guest_count,
        ]);

        return response()->json($reservation, 201);
    }

    public function update(Request $request, Reservation $reservation)
    {
        $request->validate([
            'guest_name' => 'sometimes|required|string',
            'phone_number' => [
                'sometimes',
                'required',
                new Phone('HU'),
                Rule::unique('reservations', 'phone_number')->ignore($reservation->id),
            ],
            'guest_count' => 'sometimes|required|integer|min:1',
            'start_time' => 'sometimes|required|date|after_or_equal:now',
        ]);

        $reservation->fill($request->only(['guest_name', 'phone_number']));

        $newGuestCount = $request->input('guest_count', $reservation->guest_count);
        $newStartTime = $request->has('start_time')
            ? Carbon::parse($request->input('start_time'))
            : Carbon::parse($reservation->start_time);

        $newEndTime = $newStartTime->copy()->addHours(2);

        $guestCountChanged = $newGuestCount !== $reservation->guest_count;
        $startTimeChanged = !$newStartTime->equalTo(Carbon::parse($reservation->start_time));

        if ($guestCountChanged || $startTimeChanged) {

            $table = $this->findAvailableTableForUpdate($newStartTime, $newGuestCount, $reservation);

            if (!$table) {
                return response()->json([
                    'message' => 'Sajnos nincs szabad asztal az új beállításokkal.',
                ], 422);
            }

            $reservation->table_id = $table->id;
            $reservation->guest_count = $newGuestCount;
            $reservation->start_time = $newStartTime;
            $reservation->end_time = $newEndTime;
        }

        $reservation->save();

        return response()->json($reservation, 200);
    }

    protected function findAvailableTableForUpdate(Carbon $requestedTime, int $guestCount, Reservation $currentReservation)
    {
        $reservationStart = $requestedTime->copy();
        $reservationEnd = $requestedTime->copy()->addHours(2);

        return Table::where('capacity', '>=', $guestCount)
            ->whereDoesntHave('orders', function ($query) {
                $query->where('status', '!=', 'done');
            })
            ->whereDoesntHave('reservations', function ($query) use ($reservationStart, $reservationEnd, $currentReservation) {
                $query
                    ->where('id', '!=', $currentReservation->id)
                    ->where('start_time', '<', $reservationEnd)
                    ->where('end_time', '>', $reservationStart)
                    ->whereDoesntHave('order', function ($q) {
                        $q->where('status', 'done');
                    });
            })
            ->orderBy('capacity', 'asc')
            ->first();
    }

    public function destroy(Reservation $reservation)
    {
        $reservation->delete();

        return response()->json("", 204);
    }
}
