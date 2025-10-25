<?php
use Rebing\GraphQL\GraphQLController;
use Illuminate\Support\Facades\Route;

Route::get('/graphiql', function () {
    return view('lighthouse::graphiql');
});
Route::get('/', function () {
    return view('welcome');
});
