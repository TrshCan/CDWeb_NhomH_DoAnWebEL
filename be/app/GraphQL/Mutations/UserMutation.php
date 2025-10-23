<?php

namespace App\GraphQL\Mutations;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use GraphQL\Error\Error;


class UserMutation
{
    public function registerUser($root, array $args)
    {
         if (User::where('email', $args['email'])->exists()) {
            throw new Error("Email already exists");
        }

        return User::create([
            'name' => $args['name'],
            'email' => $args['email'],
            'password' => Hash::make($args['password']),
            'status_id' => 1, // hoặc giá trị mặc định hợp lý
        ]);

    }
}
