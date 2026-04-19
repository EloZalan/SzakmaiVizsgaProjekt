<?php

namespace App\Http\Controllers;

use App\Mail\WaiterInviteMail;
use App\Models\Payment;
use App\Models\Reservation;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class AdminActionsController extends Controller
{
    public function addWaiter(Request $request) {
        $validated = $request->validate([
            'name' => 'required|string',
            'email' => 'required|string|unique:users,email|email',
        ]);

        $plainInviteToken = Str::random(64);
        $hashedInviteToken = hash('sha256', $plainInviteToken);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make(Str::random(40)),
            'role' => 'waiter',
            'on_shift' => false,
            'email_verified_at' => null,
            'invite_token' => $hashedInviteToken,
            'invite_expires_at' => now()->addDays(2),
            'invited_at' => now(),
        ]);

        $inviteUrl = rtrim((string) env('FRONTEND_URL', 'http://localhost:4200'), '/')
            . '/invite/' . $plainInviteToken;

        try {
            Mail::to($user->email)->send(new WaiterInviteMail($user, $inviteUrl));
        } catch (\Throwable $exception) {
            $user->delete();

            report($exception);

            return response()->json([
                'message' => 'A meghívó email küldése sikertelen volt, a pincér nem lett létrehozva.',
            ], 500);
        }

        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'on_shift' => $user->on_shift,
            'invite_pending' => true,
            'invite_expires_at' => $user->invite_expires_at,
        ], 201);
    }

    public function showWaiterInvite(string $token)
    {
        $user = $this->findPendingInviteUser($token);

        if (!$user) {
            return response()->json([
                'message' => 'Ez a meghívó már nem érvényes.',
            ], 404);
        }

        return response()->json([
            'name' => $user->name,
            'email' => $user->email,
            'expires_at' => $user->invite_expires_at,
        ]);
    }

    public function acceptWaiterInvite(Request $request, string $token)
    {
        $validated = $request->validate([
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = $this->findPendingInviteUser($token);

        if (!$user) {
            return response()->json([
                'message' => 'Ez a meghívó már nem érvényes.',
            ], 404);
        }

        $user->password = Hash::make($validated['password']);
        $user->email_verified_at = now();
        $user->invite_token = null;
        $user->invite_expires_at = null;
        $user->save();

        return response()->json([
            'message' => 'A meghívó aktiválva lett. Most már bejelentkezhetsz.',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
            ],
        ]);
    }

    public function deleteWaiter(Request $request, Int $id) {
        $user = User::where('id', $id)->first();
        if (!$user) {
            return response()->json([
                'message' => 'Nem talalhato ilyen azonositoju pincer'
            ], 404);
        }
        User::destroy($user->id);

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
                'invite_pending' => $user->hasPendingInvite(),
                'invite_expires_at' => $user->invite_expires_at,
                'email_verified_at' => $user->email_verified_at,
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

    private function findPendingInviteUser(string $token): ?User
    {
        return User::where('role', 'waiter')
            ->where('invite_token', hash('sha256', $token))
            ->whereNull('email_verified_at')
            ->whereNotNull('invite_expires_at')
            ->where('invite_expires_at', '>', now())
            ->first();
    }

}
