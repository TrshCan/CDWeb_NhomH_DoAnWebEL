<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UserAndStatusSeeder extends Seeder
{
    public function run(): void
    {
        // -------------------------------
        // 1️⃣ Seed statuses
        // -------------------------------
        DB::table('statuses')->insertOrIgnore([
            ['id' => 1, 'name' => 'active', 'created_at' => now(), 'updated_at' => now()],
            ['id' => 2, 'name' => 'banned', 'created_at' => now(), 'updated_at' => now()],
        ]);

        // -------------------------------
        // 2️⃣ Seed 10 users
        // -------------------------------
        for ($i = 1; $i <= 10; $i++) {
            User::updateOrCreate(
                ['id' => $i],
                [
                    'name' => "User $i",
                    'email' => "user$i@example.com",
                    'password' => Hash::make('password123'),
                    'status_id' => 1, // foreign key đã có
                    'email_verified_at' => now(),
                    'remember_token' => Str::random(10),
                ]
            );
        }
    }
}