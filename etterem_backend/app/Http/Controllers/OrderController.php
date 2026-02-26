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

        $activeReservation = Reservation::where('table_id', $table->id)
            ->where('start_time', '<=', $now)
            ->where('end_time', '>=', $now)
            ->first();

        if (!$activeReservation) {
            return response()->json([
                'message' => 'Ezen az asztalon jelenleg nincs érvényes foglalás.'
            ], 400);
        }

        $existingOrder = Order::where('table_id', $table->id)
            ->where('status', '!=', 'done')
            ->first();

        if ($existingOrder) {
            return response()->json([
                'message' => 'Az asztalon már van egy aktív rendelés!',
                'current_status' => $existingOrder->status
            ], 400);
        }

        $order = Order::create([
            'table_id' => $table->id,
            'waiter_id' => Auth::id(),
            'total_price' => 0,
            'status' => 'in_progress'
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

    public function addItem(Request $request, Order $order) {
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
            'message' => 'Tétel hozzáadva!',
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
            'message' => 'Szimuláció: A rendelés most már fizetésre kész!',
            'order_id' => $order->id,
            'new_status' => $order->status,
            'total_amount' => $order->total_price
        ]);
    }
}
