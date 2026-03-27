<?php

namespace App\Http\Controllers;

use App\Events\TableStatusChanged;
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
        return response()->json(
            Reservation::query()
                ->whereNull('admin_released_at')
                ->get()
        );
    }

    public function todayWithOrders()
    {
        $todayStart = Carbon::today();
        $tomorrowStart = Carbon::tomorrow();

        $reservations = Reservation::query()
            ->with([
                'table:id,capacity',
                'order.orderItems.menuItem:id,name,price',
                'order.payments:id,order_id,amount,payment_method,created_at',
            ])
            ->whereNull('admin_released_at')
            ->where('start_time', '>=', $todayStart)
            ->where('start_time', '<', $tomorrowStart)
            ->orderBy('start_time')
            ->get();

        $payload = $reservations->map(function (Reservation $reservation) {
            $order = $reservation->order;
            $latestPayment = $order?->payments?->sortByDesc('created_at')->first();

            $items = $order
                ? $order->orderItems->map(function ($orderItem) {
                    $menuItem = $orderItem->menuItem;
                    $price = (int)($menuItem?->price ?? 0);

                    return [
                        'id' => $orderItem->id,
                        'menu_item_id' => $orderItem->menu_item_id,
                        'name' => $menuItem?->name ?? 'Tétel',
                        'price' => $price,
                        'quantity' => (int)$orderItem->quantity,
                        'line_total' => $price * (int)$orderItem->quantity,
                    ];
                })->values()
                : [];

            $orderTotal = (int)($order?->total_price ?? 0);
            $paidTotal = $latestPayment ? (int)$latestPayment->amount : null;
            $displayTotal = $paidTotal ?? $orderTotal;

            return [
                'reservation_id' => $reservation->id,
                'table_id' => $reservation->table_id,
                'table_capacity' => $reservation->table?->capacity,
                'guest_name' => $reservation->guest_name,
                'guest_count' => (int)$reservation->guest_count,
                'start_time' => $reservation->start_time?->toIso8601String(),
                'end_time' => $reservation->end_time?->toIso8601String(),
                'note' => $reservation->note,
                'order' => $order
                    ? [
                        'order_id' => $order->id,
                        'status' => $order->status,
                        'opened_at' => $order->created_at?->toIso8601String(),
                        'total_price' => $orderTotal,
                        'paid_total' => $paidTotal,
                        'display_total' => $displayTotal,
                        'payment_method' => $latestPayment?->payment_method,
                        'items' => $items,
                    ]
                    : null,
            ];
        })->values();

        return response()->json($payload);
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
            'start_time' => 'required|date|after_or_equal:now',
            'note' => 'sometimes|nullable|string|max:500',
        ]);

        $maxCapacity = Table::max('capacity');
        if ($maxCapacity === null || (int) $request->guest_count > (int) $maxCapacity) {
            return response()->json([
                'message' => $this->t([
                    'hu' => 'Sikertelen foglalás: nincs ekkora asztal az étteremben.',
                    'en' => 'Reservation failed: there is no table this large in the restaurant.',
                ], $request),
            ], 422);
        }

        $startTime = Carbon::parse($request->start_time);
        $endTime = $startTime->copy()->addHours(2);

        $table = $this->reservationService->findAvailableTable(
            $startTime,
            $request->guest_count
        );

        if (!$table) {
            return response()->json([
                'message' => $this->t([
                    'hu' => 'Sikertelen foglalás: nincs szabad asztal ebben az időpontban.',
                    'en' => 'Reservation failed: no table is available at this time.',
                ], $request),
            ], 422);
        }

        $reservation = Reservation::create([
            'table_id' => $table->id,
            'guest_name' => $request->guest_name,
            'phone_number' => $request->phone_number,
            'start_time' => $startTime,
            'end_time' => $endTime,
            'guest_count' => $request->guest_count,
            'note' => $request->input('note') ?: null,
        ]);

        event(new TableStatusChanged($table->id));

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
            return response()->json([
                'message' => $this->t([
                    'hu' => 'Sajnos nincs szabad asztal jelenleg.',
                    'en' => 'Unfortunately there are no free tables at the moment.',
                ], $request),
            ], 422);
        }

        $reservation = Reservation::create([
            'table_id' => $table->id,
            'guest_name' => 'Helyszíni vendég',
            'phone_number' => null,
            'start_time' => $startTime,
            'end_time' => $endTime,
            'guest_count' => $request->guest_count,
        ]);

        event(new TableStatusChanged($table->id));

        return response()->json($reservation, 201);
    }

    public function update(Request $request, Reservation $reservation)
    {
        $originalTableId = $reservation->table_id;

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
            'note' => 'sometimes|nullable|string|max:500',
        ]);

        $reservation->fill($request->only(['guest_name', 'phone_number', 'note']));
        if ($request->has('note') && $request->input('note') === '') {
            $reservation->note = null;
        }

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

        event(new TableStatusChanged($reservation->table_id));

        if ($originalTableId !== $reservation->table_id) {
            event(new TableStatusChanged($originalTableId));
        }

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
                    ->whereNull('admin_released_at')
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
        $tableId = $reservation->table_id;

        $reservation->delete();

        event(new TableStatusChanged($tableId));

        return response()->json("", 204);
    }
}
