<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function login(Request $request) {
        $validated = $request->validate([
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            return response(['message' => 'Hibás adatok'], 401);
        }

        $token = $user->createToken('myapptoken')->plainTextToken;

        return response(['user' => $user, 'token' => $token], 200);
    }

    public function me(Request $request) {
        $user = $request->user();
        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'on_shift' => $user->on_shift,
        ]);
    }

    public function update(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'email' => 'sometimes|required|email|unique:users,email,' . $user->id,
            'password' => 'sometimes|required|string|min:8|confirmed',
        ]);

        if (isset($validated['email'])) {
            $user->email = $validated['email'];
        }

        if (isset($validated['password'])) {
            $user->password = Hash::make($validated['password']);
        }

        $user->save();

        return response()->json($user, 200);
    }

    public function takeShift(Request $request) {
        $user = $request->user();

        if ($user->role !== 'waiter') {
            return response()->json(['message' => 'Csak pincér vehet fel műszakot.'], 403);
        }

        $user->on_shift = true;
        $user->save();

        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'on_shift' => $user->on_shift,
        ], 200);
    }

    public function logout(Request $request) {
        $user = $request->user();
        $user->on_shift = false;
        $user->save();
        $user->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Sikeres kijelentkeztetés.'
        ], 200);
    }
}
