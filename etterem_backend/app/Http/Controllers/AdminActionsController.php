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
            'role' => 'waiter'
        ]);



        return response(['waiter' => $user], 201);
    }

    public function deleteWaiter(Request $request) {
        $user = User::where('email', $request->email)->first();
        if (!$user) {
            return response()->json([
                'message' => 'Ilyen emaillel nem létezik felhasználó.'
            ], 404);
        }
        User::destroy($user->id);
        return response()->json([
            'message' => 'Pincér törölve.'
        ], 200);
    }
}
