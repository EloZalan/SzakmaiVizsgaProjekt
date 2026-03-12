<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class CheckWaiterOnShift
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = Auth::user();

        if (($user && $user->role === 'waiter' && $user->on_shift) || $user->role === 'admin') {
            return $next($request);
        }

        return response()->json([
            'message' => 'Csak műszakban lévő pincér érheti el ezt a végpontot.'
        ], 403);
    }
}

