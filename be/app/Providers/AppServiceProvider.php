<?php

namespace App\Providers;

use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        VerifyEmail::createUrlUsing(function ($notifiable) {
            $parameters = [
                'id' => $notifiable->getKey(),
                'hash' => sha1($notifiable->getEmailForVerification()),
            ];

            if ($redirectBase = config('app.frontend_url')) {
                $parameters['redirect'] = rtrim($redirectBase, '/') . '/email-verified';
            }

            return URL::temporarySignedRoute(
                'verification.verify',
                now()->addMinutes(config('auth.verification.expire', 60)),
                $parameters
            );
        });
    }
}
