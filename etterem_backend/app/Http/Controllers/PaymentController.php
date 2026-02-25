<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Table;
use App\Models\Payment;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function pay(Request $request, Order $order) {
        $request->validate([
            'payment_method' => 'required|in:cash,card',
        ]);

        if ($order->status === "done") {
            return response()->json([
                "message" => "Ez már lezárt rendelés.",
            ], 400);
        }

        if ($order->status === "in_progress") {
            return response()->json([
                "message" => "Meg etkeznek"
            ], 400);
        }

        $payment = Payment::create([
            'order_id' => $order->id,
            'amount' => $order->total_price,
            'payment_method' => $request->payment_method,
            'paid_at' => now(),
        ]);

        $order->update(['status' => 'done']);

        return response()->json([
            'message' => 'Sikeres fizetés! A rendelés lezárva és az asztal felszabadítva.',
            'payment_id' => $payment->id,
            'order_status' => 'done',
            'table' => [
                'id' => $order->table_id,
                'status' => $order->table?->status
            ]
        ]);

    }
}
