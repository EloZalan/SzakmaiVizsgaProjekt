<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckTokenActivity
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        if ($user && $user->currentAccessToken()) {
            $lastUsed = $user->currentAccessToken()->last_used_at;

            if ($lastUsed && $lastUsed->diffInMinutes(now()) > 1) {
                $request->user()->currentAccessToken()->delete();
                return response()->json(['message' => 'A folyamat megszakadt inaktivitás miatt.'], 401);
            }
        }
        return $next($request);
    }
}
