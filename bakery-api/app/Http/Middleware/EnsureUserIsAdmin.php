<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsAdmin
{
    /**
     * Allow only active admin accounts (Sanctum-authenticated) through.
     * Employee accounts can work in the back office but must not manage it.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || ! $user->isAdmin()) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        if (! $user->is_active) {
            return response()->json(['message' => 'This account has been deactivated.'], 403);
        }

        return $next($request);
    }
}
