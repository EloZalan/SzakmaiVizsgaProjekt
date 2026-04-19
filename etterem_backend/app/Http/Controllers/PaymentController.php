<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;

class PaymentController extends Controller
{
    public function pay(Request $request, Order $order) {
        $request->validate([
            'payment_method' => 'required|in:cash,card',
            'tip' => 'sometimes|nullable|integer|min:0',
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

        $tip = (int)($request->input('tip', 0));
        $amount = $order->total_price + $tip;

        $paymentData = [
            'order_id' => $order->id,
            'amount' => $amount,
            'payment_method' => $request->payment_method,
        ];

        if (Schema::hasColumn('payments', 'paid_at')) {
            $paymentData['paid_at'] = now();
        }

        $payment = Payment::create($paymentData);

        $order->update(['status' => 'done']);

        return response()->json([
            'payment_id' => $payment->id,
            'order_status' => 'done',
            'table' => [
                'id' => $order->table_id,
                'status' => $order->table?->status
            ]
        ]);

    }
}
