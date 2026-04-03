<?php

namespace App\Http\Controllers;

use App\Events\WaiterStatusChanged;
use App\Models\Payment;
use App\Models\Reservation;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AdminActionsController extends Controller
{
    public function addWaiter(Request $request) {
        $validated = $request->validate([
            'name' => 'required|string',
            'email' => 'required|string|unique:users,email|email',
            'password' => 'required|string|confirmed'
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => 'waiter',
            'on_shift' => false,
        ]);

        event(new WaiterStatusChanged($user->id, false, 'created'));



        return response($user, 201);
    }

    public function deleteWaiter(Request $request, Int $id) {
        $user = User::where('id', $id)->first();
        if (!$user) {
            return response()->json([
                'message' => 'Nem talalhato ilyen azonositoju pincer'
            ], 404);
        }
        User::destroy($user->id);

        event(new WaiterStatusChanged($user->id, null, 'deleted'));

        return response()->json("", 204);
    }

    public function getAllWaiter(Request $request) {
        $users = User::where('role', 'waiter')->get();
        return response()->json($users->map(function (User $user) {
            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'on_shift' => $user->on_shift,
            ];
        }), 200);
    }

    public function getDailyRevenue() {
        $total = Payment::whereDate('paid_at', today())
            ->with('order:id,total_price')
            ->get()
            ->sum(function (Payment $payment) {
                return (int)($payment->order?->total_price ?? 0);
            });

        return response()->json(['daily_revenue' => (int) $total]);
    }

    public function getTodayGuests()
    {
        $total = Reservation::whereDate('start_time', today())
            ->whereHas('order', fn($q) => $q->where('status', 'done'))
            ->sum('guest_count');
        return response()->json(['today_guests' => (int) $total]);
    }

    public function getGuestCountHistory()
    {
        $history = collect(range(9, 0))->map(function (int $daysAgo) {
            $day = now()->subDays($daysAgo)->toDateString();

            $count = Reservation::whereDate('start_time', $day)
                ->whereHas('order', fn($q) => $q->where('status', 'done'))
                ->sum('guest_count');

            return [
                'date'        => $day,
                'guest_count' => (int) $count,
            ];
        });

        return response()->json($history);
    }

}
