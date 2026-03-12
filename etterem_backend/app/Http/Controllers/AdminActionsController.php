<?php

namespace App\Http\Controllers;

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

}
