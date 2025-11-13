<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Config;

class EmailVerificationController extends Controller
{
    public function verify(Request $request, int $id, string $hash): RedirectResponse
    {
        if (! $request->hasValidSignature()) {
            abort(403, 'Liên kết xác thực không hợp lệ hoặc đã hết hạn.');
        }

        $user = User::findOrFail($id);

        if (! hash_equals($hash, sha1($user->getEmailForVerification()))) {
            abort(403, 'Liên kết xác thực không hợp lệ.');
        }

        $alreadyVerified = $user->hasVerifiedEmail();

        if (! $alreadyVerified) {
            $user->markEmailAsVerified();
            event(new Verified($user));
        }

        return redirect($this->determineRedirectUrl($request, $alreadyVerified));
    }

    protected function determineRedirectUrl(Request $request, bool $alreadyVerified): string
    {
        $status = $alreadyVerified ? 'already_verified' : 'success';

        $fallback = Config::get('app.frontend_url', Config::get('app.url'));
        $redirect = $request->query('redirect', $fallback);

        if (! $redirect) {
            return url('/');
        }

        $separator = str_contains($redirect, '?') ? '&' : '?';

        return rtrim($redirect, '/') . $separator . 'status=' . $status;
    }
}

