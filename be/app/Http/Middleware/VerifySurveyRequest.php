<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;

class VerifySurveyRequest
{
    public function handle(Request $request, Closure $next)
    {
        // Verify CSRF token for state-changing requests
        if ($request->isMethod('POST') && !app()->runningUnitTests()) {
            if (!$request->header('X-CSRF-TOKEN') || $request->header('X-CSRF-TOKEN') !== csrf_token()) {
                return response()->json(['error' => 'Invalid CSRF token'], 403);
            }
        }

        // Verify request origin
        $allowedDomains = config('app.allowed_domains', []);
        $origin = $request->header('Origin');
        
        if ($origin && !in_array(parse_url($origin, PHP_URL_HOST), $allowedDomains)) {
            return response()->json(['error' => 'Unauthorized origin'], 403);
        }

        // Rate limit submissions (5 attempts per minute)
        $key = 'survey-submit:' . $request->ip();
        if (RateLimiter::tooManyAttempts($key, 5)) {
            return response()->json(['error' => 'Too many attempts'], 429);
        }
        RateLimiter::hit($key);

        return $next($request);
    }
}
