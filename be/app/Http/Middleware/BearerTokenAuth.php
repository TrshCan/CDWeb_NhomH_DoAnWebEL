<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\User;
use Symfony\Component\HttpFoundation\Response;

class BearerTokenAuth
{
    /**
     * Handle an incoming request.
     * Authenticate user from Bearer token in Authorization header
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Kiểm tra Authorization header
        $authHeader = $request->header('Authorization');
        
        if ($authHeader && str_starts_with($authHeader, 'Bearer ')) {
            $token = substr($authHeader, 7); // Remove "Bearer " prefix
            
            // Tìm user theo remember_token
            $user = User::where('remember_token', $token)->first();
            
            if ($user) {
                // Set user vào Auth guard
                Auth::login($user);
            }
        }
        
        return $next($request);
    }
}

