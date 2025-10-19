<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Carbon\Carbon;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();

        // ===== Faculties =====
        for ($i = 1; $i <= 10; $i++) {
            DB::table('faculties')->insert([
                'name' => "Faculty $i",
                'description' => "Description for faculty $i",
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        // ===== Statuses =====
        DB::table('statuses')->insert([
            ['name' => 'active', 'reason' => null, 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'banned', 'reason' => 'Violation', 'created_at' => $now, 'updated_at' => $now],
        ]);

        // ===== Classes =====
        for ($i = 1; $i <= 10; $i++) {
            DB::table('classes')->insert([
                'name' => "Class $i",
                'description' => "Description for class $i",
                'faculty_id' => rand(1, 10),
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        // ===== Users =====
        for ($i = 1; $i <= 10; $i++) {
            DB::table('users')->insert([
                'name' => "User $i",
                'email' => "user$i@example.com",
                'email_verified_at' => $now,
                'password' => bcrypt('password'),
                'remember_token' => Str::random(10),
                'phone' => '090' . rand(1000000, 9999999),
                'address' => "Address $i",
                'role' => ['student', 'lecturer', 'admin'][rand(0, 2)],
                'class_id' => rand(1, 10),
                'faculty_id' => rand(1, 10),
                'status_id' => 1,
                'ban_reason' => null,
                'point' => rand(0, 100),
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        // ===== Permissions =====
        for ($i = 1; $i <= 10; $i++) {
            DB::table('permissions')->insert([
                'name' => "permission_$i",
                'description' => "Permission number $i",
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        // ===== Groups =====
        for ($i = 1; $i <= 10; $i++) {
            DB::table('groups')->insert([
                'name' => "Group $i",
                'description' => "Group description $i",
                'created_by' => rand(1, 10),
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        // ===== Categories =====
        for ($i = 1; $i <= 10; $i++) {
            DB::table('categories')->insert([
                'id' => $i,
                'name' => "Category $i",
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        // ===== Badges =====
        for ($i = 1; $i <= 10; $i++) {
            DB::table('badges')->insert([
                'name' => "Badge $i",
                'description' => "Badge description $i",
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        // ===== Surveys =====
        for ($i = 1; $i <= 10; $i++) {
            DB::table('surveys')->insert([
                'title' => "Survey $i",
                'description' => "Survey description $i",
                'categories_id' => rand(1, 10),
                'type' => ['survey', 'quiz'][rand(0, 1)],
                'start_at' => $now,
                'end_at' => $now->copy()->addDays(7),
                'points' => rand(0, 10),
                'object' => ['public', 'students', 'lecturers'][rand(0, 2)],
                'created_by' => rand(1, 10),
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        // ===== Events =====
        for ($i = 1; $i <= 10; $i++) {
            DB::table('events')->insert([
                'title' => "Event $i",
                'event_date' => $now->copy()->addDays($i),
                'location' => "Location $i",
                'created_at' => $now,
                'created_by' => rand(1, 10),
            ]);
        }

        // ===== Deadlines =====
        for ($i = 1; $i <= 10; $i++) {
            DB::table('deadlines')->insert([
                'title' => "Deadline $i",
                'deadline_date' => $now->copy()->addDays($i + 10),
                'details' => "Details for deadline $i",
                'created_at' => $now,
                'created_by' => rand(1, 10),
            ]);
        }

        // ===== Follows (đảm bảo 10 cặp unique, không tự follow)
        $pairs = [];
        $followRows = [];
        while (count($followRows) < 10) {
            $follower = rand(1, 10);
            $followed = rand(1, 10);

            if ($follower === $followed) {
                continue; // không tự follow
            }

            $key = $follower . '-' . $followed;
            if (isset($pairs[$key])) {
                continue; // tránh trùng cặp
            }

            $pairs[$key] = true;
            $followRows[] = [
                'follower_id' => $follower,
                'followed_id' => $followed,
                'status' => 'active',
                'created_at' => $now,
            ];
        }
        DB::table('follows')->insert($followRows);

        // ===== UserBadges =====
        for ($i = 1; $i <= 10; $i++) {
            DB::table('user_badges')->insert([
                'user_id' => rand(1, 10),
                'badge_id' => rand(1, 10),
                'assigned_by' => rand(1, 10),
                'assigned_at' => $now,
            ]);
        }

        // ===== Posts Seeder =====

        $contents = [
            'Just finished a great meeting!',
            'Check out this cool photo!',
            'Anyone up for a group hike?',
            'Reminder: project deadline is tomorrow.',
            'Feeling grateful today.',
            'Here’s a quick update on our progress.',
            'Funny thing happened at work today...',
            'Sharing some thoughts on leadership.',
            'New announcement coming soon!',
            'Let’s celebrate our recent success!'
        ];

        for ($i = 1; $i <= 10; $i++) {
            $createdAt = Carbon::now()->subDays(rand(1, 30))->subMinutes(rand(1, 1440));

            DB::table('posts')->insert([
                'user_id' => rand(1, 10),
                'group_id' => rand(1, 10),
                'type' => ['announcement', 'group_post', 'comment', 'normal_post'][rand(0, 3)],
                'content' => $contents[array_rand($contents)],
                'media_url' => rand(0, 1) ? 'https://example.com/media/' . rand(100, 999) . '.jpg' : null,
                'created_at' => $createdAt,
                'updated_at' => $createdAt,
            ]);
        }

    }
}
