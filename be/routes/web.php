<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\EmailVerificationController;


Route::get('/graphiql', function () {
    return view('lighthouse::graphiql');
});

Route::get('/', function () {
    return view('welcome');
});

Route::get('/email/verify/{id}/{hash}', [EmailVerificationController::class, 'verify'])
    ->middleware(['signed', 'throttle:6,1'])
    ->name('verification.verify');
