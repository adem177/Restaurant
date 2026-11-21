<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsStaff
{
    /**
     * Allow only admin/employee accounts (Sanctum-authenticated) through.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || ! $user->isStaff()) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        if (! $user->is_active) {
            return response()->json(['message' => 'This account has been deactivated.'], 403);
        }

        return $next($request);
    }
}
