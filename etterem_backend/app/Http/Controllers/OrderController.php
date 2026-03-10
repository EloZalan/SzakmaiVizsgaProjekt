<?php

namespace App\Http\Controllers;

use App\Models\MenuItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Reservation;
use App\Models\Table;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class OrderController extends Controller
{
    public function openOrder(Request $request, Table $table) {
        $now = Carbon::now();

        $activeReservation = $table->reservations()
            ->where('start_time', '<=', $now)
            ->where('end_time', '>', $now)
            ->latest('start_time')
            ->first();

        if (!$activeReservation) {
            return response()->json(['message' => 'Nincs érvényes foglalás ebben az időpontban.'], 400);
        }

        $existingOrder = Order::where('reservation_id', $activeReservation->id)->first();

        if ($existingOrder) {
            $statusMessage = $existingOrder->status === 'done'
                ? 'Ez a vendég már fizetett és távozott!'
                : 'Ehhez a foglaláshoz már van egy aktív rendelés!';

            return response()->json([
                'message' => $statusMessage,
                'order_id' => $existingOrder->id
            ], 400);
        }

        $order = Order::create([
            'table_id' => $table->id,
            'reservation_id' => $activeReservation->id,
            'waiter_id' => Auth::id(),
            'total_price' => 0,
            'status' => 'in_progress'
        ]);

        return response()->json($order, 201);
    }

    public function addItem(Request $request, Order $order) {
        if ($order->status !== 'in_progress') {
            return response()->json([
                'message' => 'Ehhez a rendeléshez már nem vehetsz fel új tételt.'
            ], 400);
        }

        $fields = $request->validate([
            'menu_item_id' => 'required|exists:menu_items,id',
            'quantity' => 'required|integer|min:1',
        ]);

        $menuItem = MenuItem::findOrFail($fields['menu_item_id']);

        $orderItem = OrderItem::create([
            'order_id' => $order->id,
            'menu_item_id' => $menuItem->id,
            'quantity' => $fields['quantity'],
        ]);

        $addedPrice = $menuItem->price * $fields['quantity'];
        $order->increment('total_price', $addedPrice);

        return response()->json([
            'item' => $menuItem->name,
            'quantity' => $fields['quantity'],
            'current_total' => $order->total_price
        ], 201);
    }

    public function simulateReadyToPay(Order $order) {
        if ($order->orderItems->isEmpty() || $order->status === "done") {
            return response()->json([
                'message' => 'Nincs fizetendő rendelés.'
            ], 422);
        }

        $order->update(['status' => 'ready_to_pay']);

        return response()->json([
            'order_id' => $order->id,
            'new_status' => $order->status,
            'total_amount' => $order->total_price
        ]);
    }
}
