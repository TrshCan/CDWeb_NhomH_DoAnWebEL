<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Carbon\Carbon;
use Faker\Factory as Faker;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $faker = Faker::create();
        $now = Carbon::now();

        // ===== Faculties =====
        // Generate faculty codes (2 letters, unique)
        $facultyCodes = ['TT', 'CN', 'KT', 'NN', 'SP', 'YT', 'QT', 'LD', 'TH', 'VL'];
        for ($i = 1; $i <= 10; $i++) {
            DB::table('faculties')->insert([
                'name' => "Faculty $i",
                'code' => $facultyCodes[$i - 1] ?? str_pad((string) $i, 2, '0', STR_PAD_LEFT),
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
        // Helper function to generate student code
        $generateStudentCode = function ($facultyId) use ($now) {
            $faculty = DB::table('faculties')->where('id', $facultyId)->first();
            if (!$faculty || !$faculty->code) {
                return null;
            }

            $facultyCode = strtoupper($faculty->code);
            // Get last 2 digits of year, minimum is 23 (first year is 2023)
            $yearPart = max(23, (int) substr($now->year, -2));
            $yearPart = str_pad((string) $yearPart, 2, '0', STR_PAD_LEFT);

            // Generate unique 4-digit number
            $maxAttempts = 100;
            $attempt = 0;

            do {
                $randomPart = str_pad((string) rand(0, 9999), 4, '0', STR_PAD_LEFT);
                $studentCode = $yearPart . '211' . $facultyCode . $randomPart;

                // Check if this code already exists
                $exists = DB::table('users')->where('student_code', $studentCode)->exists();
                $attempt++;

                if ($attempt >= $maxAttempts) {
                    throw new \Exception("Could not generate unique student code after {$maxAttempts} attempts");
                }
            } while ($exists);

            return $studentCode;
        };

        for ($i = 1; $i <= 10; $i++) {
            $role = $i <= 8 ? 'student' : ($i === 9 ? 'lecturer' : 'admin');
            $facultyId = rand(1, 10);
            $studentCode = null;

            // Generate student code only for students
            if ($role === 'student') {
                $studentCode = $generateStudentCode($facultyId);
            }

            DB::table('users')->insert([
                'name' => "User $i",
                'email' => "user$i@example.com",
                'email_verified_at' => $now,
                'password' => bcrypt('password'),
                'remember_token' => Str::random(10),
                'phone' => '090' . rand(1000000, 9999999),
                'address' => "Address $i",
                'role' => $role,
                'class_id' => rand(1, 10),
                'faculty_id' => $facultyId,
                'student_code' => $studentCode,
                'status_id' => 1,
                'ban_reason' => null,
                'point' => rand(0, 100),
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
        // ----- 2 **known** test accounts -----
        $testUsers = [
            [
                'name' => 'Test Admin',
                'email' => 'admin@test.com',
                'password' => bcrypt('admin123'),
                'role' => 'admin',
                'phone' => '0901111111',
                'address' => 'Admin HQ',
                'class_id' => 1,
                'faculty_id' => 1,
                'status_id' => 1,
                'point' => 999,
            ],
            [
                'name' => 'Test Student',
                'email' => 'student@test.com',
                'password' => bcrypt('student123'),
                'role' => 'student',
                'phone' => '0902222222',
                'address' => 'Student Dorm',
                'class_id' => 5,
                'faculty_id' => 3,
                'status_id' => 1,
                'point' => 42,
            ],
        ];

        foreach ($testUsers as $u) {
            $studentCode = null;
            
            // Generate student code for test student
            if (isset($u['role']) && $u['role'] === 'student' && isset($u['faculty_id'])) {
                $faculty = DB::table('faculties')->where('id', $u['faculty_id'])->first();
                if ($faculty && $faculty->code) {
                    $facultyCode = strtoupper($faculty->code);
                    // Get last 2 digits of year, minimum is 23 (first year is 2023)
                    $yearPart = max(23, (int) substr($now->year, -2));
                    $yearPart = str_pad((string) $yearPart, 2, '0', STR_PAD_LEFT);
                    
                    $maxAttempts = 100;
                    $attempt = 0;
                    do {
                        $randomPart = str_pad((string) rand(0, 9999), 4, '0', STR_PAD_LEFT);
                        $studentCode = $yearPart . '211' . $facultyCode . $randomPart;
                        $exists = DB::table('users')->where('student_code', $studentCode)->exists();
                        $attempt++;
                        if ($attempt >= $maxAttempts) {
                            throw new \Exception("Could not generate unique student code for test user");
                        }
                    } while ($exists);
                }
            }

            DB::table('users')->insert(array_merge($u, [
                'email_verified_at' => $now,
                'remember_token' => Str::random(10),
                'ban_reason' => null,
                'student_code' => $studentCode,
                'created_at' => $now,
                'updated_at' => $now,
            ]));
        }

        // ===== Permissions =====
        $permissions = [
            // Bài viết
            ['name' => 'create_post', 'description' => 'Tạo bài viết'],
            ['name' => 'comment_post', 'description' => 'Bình luận'],
            ['name' => 'delete_post', 'description' => 'Xóa bài viết'],
            ['name' => 'like_post', 'description' => 'Thích bài viết'],
            // Người dùng
            ['name' => 'edit_profile', 'description' => 'Sửa hồ sơ'],
            ['name' => 'change_avatar', 'description' => 'Đổi avatar'],
            // Hệ thống
            ['name' => 'view_dashboard', 'description' => 'Xem dashboard'],
            ['name' => 'manage_users', 'description' => 'Quản lý người dùng'],
            ['name' => 'manage_permissions', 'description' => 'Phân quyền'],
        ];

        foreach ($permissions as $permission) {
            DB::table('permissions')->insert([
                'name' => $permission['name'],
                'description' => $permission['description'],
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        // ===== Role Default Permissions =====
        $roles = ['student', 'lecturer', 'admin'];
        foreach ($roles as $role) {
            // assign 2 random permission ids to each role
            $permIds = DB::table('permissions')->inRandomOrder()->limit(2)->pluck('id')->toArray();
            foreach ($permIds as $pid) {
                DB::table('role_default_permissions')->insert([
                    'role' => $role,
                    'permission_id' => $pid,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
        }

        // ===== User Permissions =====
        // Assign some sample permissions to random users
        $userPermPairs = [];
        $userPermissions = [];
        while (count($userPermissions) < 20) {
            $u = rand(1, 12);
            $p = DB::table('permissions')->inRandomOrder()->first()->id;
            $key = $u . '-' . $p;
            if (isset($userPermPairs[$key])) continue;
            $userPermPairs[$key] = true;
            $userPermissions[] = [
                'user_id' => $u,
                'permission_id' => $p,
                'granted_at' => $now,
                'granted_by' => rand(1, 12),
            ];
        }
        DB::table('user_permissions')->insert($userPermissions);

        // ===== Groups =====
        for ($i = 1; $i <= 10; $i++) {
            DB::table('groups')->insert([
                'name' => "Group $i",
                'description' => "Group description $i",
                'code' => strtoupper(Str::random(6)),
                'created_by' => rand(1, 10),
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        // ===== Group Members =====
        // Create random membership rows (avoid duplicates)
        $pairs = [];
        $groupMembers = [];
        $roles = ['member', 'moderator', 'lecturer', 'admin'];
        while (count($groupMembers) < 40) {
            $g = rand(1, 10);
            $u = rand(1, 12); // ensure covers test users as well
            $key = $g . '-' . $u;
            if ($g === 0 || $u === 0 || isset($pairs[$key])) continue;
            $pairs[$key] = true;
            $groupMembers[] = [
                'group_id' => $g,
                'user_id' => $u,
                'role' => $roles[array_rand($roles)],
                'joined_at' => $now,
            ];
        }
        DB::table('group_members')->insert($groupMembers);

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


        // ===== Events Seeder =====
        $events = [];
        $eventTitles = [
            'Career Fair {year}',
            '{club} Club Meeting',
            'Guest Lecture: {topic}',
            'Campus {event_type} Workshop',
            'Student Council Election',
            'Hackathon {year}',
            'Cultural Festival: {culture}',
            '{sport} Team Tryouts',
            'Charity Fundraiser',
            'Tech Talk: {tech_topic}',
            'Art Exhibition',
            'Resume Building Session',
            'Environmental Awareness Rally',
            'Coding Bootcamp',
            'Music Club Jam Session',
        ];
        $locations = [
            'Lecture Hall A',
            'Campus Quad',
            'Library Seminar Room',
            'Student Union',
            'Science Building B-101',
            'Sports Complex',
            'Auditorium',
            'Cafeteria',
            'Online (Zoom)',
            null, // Include some null locations
        ];

        for ($i = 1; $i <= 20; $i++) {
            $pastDate = $faker->dateTimeBetween('-15 days', '+15 days');
            $club = $faker->randomElement(['Robotics', 'Photography', 'Debate', 'Chess', 'Drama']);
            $eventType = $faker->randomElement(['Networking', 'Coding', 'Leadership', 'Creative Writing']);
            $culture = $faker->randomElement(['Vietnamese', 'International', 'Asian', 'Western']);
            $sport = $faker->randomElement(['Soccer', 'Basketball', 'Volleyball']);
            $topic = $faker->randomElement(['AI in 2025', 'Sustainable Development', 'Blockchain Basics']);
            $techTopic = $faker->randomElement(['Cloud Computing', 'Machine Learning', 'Web Development']);
            $year = Carbon::today()->year;

            $title = $faker->randomElement($eventTitles);
            $title = str_replace(
                ['{club}', '{event_type}', '{culture}', '{sport}', '{topic}', '{tech_topic}', '{year}'],
                [$club, $eventType, $culture, $sport, $topic, $techTopic, $year],
                $title
            );

            $events[] = [
                'title' => $title,
                'event_date' => $pastDate,
                'location' => $faker->randomElement($locations),
                'created_by' => rand(1, 10), // Use rand(1, 10) for created_by
                'created_at' => $pastDate,
            ];
        }

        // Insert all 20 events in a single query
        DB::table('events')->insert($events);

        // ===== Deadlines Seeder =====
        $deadlines = [];
        $deadlineTitles = [
            'Submit {course} Assignment {number}',
            'Register for {event_type} Workshop',
            '{club} Club Membership Deadline',
            'Apply for {program} Scholarship',
            'Project Proposal for {topic}',
            'Sign-up for {sport} Team',
            'Submit {event} Feedback Form',
            'Abstract Submission for {conference}',
            'Internship Application Deadline',
            'Poster Submission for {event}',
            'Funding Request for {club} Event',
            'Exam Registration for {course}',
        ];
        $details = [
            'Submit via Google Classroom by 11:59 PM.',
            'Email your application to {email}.',
            'Register online at campus.edu/{event}.',
            'Include a 500-word essay and CV.',
            'Upload your project to GitHub.',
            'Contact the club president for details.',
            'Submit to the student portal.',
            null, // Include some null details
        ];

        for ($i = 1; $i <= 20; $i++) {
            $futureDate = $faker->dateTimeBetween('now', '+60 days');
            $course = $faker->randomElement(['CS101', 'MATH201', 'ENG301', 'PHY102']);
            $club = $faker->randomElement(['Robotics', 'Photography', 'Debate', 'Chess']);
            $eventType = $faker->randomElement(['Coding', 'Leadership', 'Networking']);
            $program = $faker->randomElement(['STEM', 'Arts', 'Global Studies']);
            $sport = $faker->randomElement(['Soccer', 'Basketball', 'Volleyball']);
            $topic = $faker->randomElement(['AI', 'Sustainability', 'Blockchain']);
            $conference = $faker->randomElement(['Tech Summit', 'Research Expo', 'Student Conference']);
            $event = $faker->randomElement(['Hackathon', 'Career Fair', 'Cultural Fest']);
            $email = $faker->randomElement(['club@campus.com', 'events@campus.com']);
            $number = $faker->numberBetween(1, 5);

            $title = $faker->randomElement($deadlineTitles);
            $title = str_replace(
                ['{course}', '{number}', '{event_type}', '{club}', '{program}', '{sport}', '{topic}', '{conference}', '{event}'],
                [$course, $number, $eventType, $club, $program, $sport, $topic, $conference, $event],
                $title
            );

            $detail = $faker->randomElement($details);
            $detail = $detail ? str_replace('{email}', $email, $detail) : null;
            $detail = $detail ? str_replace('{event}', $event, $detail) : null;

            $deadlines[] = [
                'title' => $title,
                'deadline_date' => $futureDate->format('Y-m-d H:i:s'),
                'details' => $detail,
                'created_by' => rand(1, 10), // Use rand(1, 10) for created_by
                'created_at' => $futureDate,
            ];
        }

        // Insert all 20 deadlines in a single query
        DB::table('deadlines')->insert($deadlines);

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

        $posts = [];
        $types = ['announcement', 'group_post', 'comment', 'normal_post'];

        for ($i = 1; $i <= 100; $i++) {
            // Generate a random date and time from the past year
            $pastDate = fake()->dateTimeBetween('-1 year', 'now');

            $posts[] = [
                'user_id' => rand(1, 10),
                'group_id' => rand(1, 10),
                'type' => $types[array_rand($types)],
                'content' => fake()->realText(200), // Generates realistic-looking text
                'media_url' => null,
                'created_at' => $pastDate,
                'updated_at' => $pastDate, // Set updated_at to the same time
            ];
        }

        // Insert all 10 posts in a single, efficient query
        DB::table('posts')->insert($posts);

        // ===== Group Posts (mapping posts to groups/senders) =====
        $gpPairs = [];
        $groupPosts = [];
        while (count($groupPosts) < 30) {
            $g = rand(1, 10);
            $p = rand(1, 100);
            $s = rand(1, 12);
            $key = $g . '-' . $p;
            if (isset($gpPairs[$key])) continue;
            $gpPairs[$key] = true;
            $groupPosts[] = [
                'group_id' => $g,
                'sender_id' => $s,
                'post_id' => $p,
                'sent_at' => $now,
            ];
        }
        DB::table('group_posts')->insert($groupPosts);

        // ===== Post Likes =====
        $likePairs = [];
        $postLikes = [];
        while (count($postLikes) < 120) {
            $postId = rand(1, 100);
            $userId = rand(1, 12);
            $key = $postId . '-' . $userId;
            if (isset($likePairs[$key])) continue;
            $likePairs[$key] = true;
            $postLikes[] = [
                'post_id' => $postId,
                'user_id' => $userId,
                'created_at' => $now,
            ];
        }
        DB::table('post_likes')->insert($postLikes);

        // ===== Post Shares =====
        $sharePairs = [];
        $postShares = [];
        while (count($postShares) < 40) {
            $postId = rand(1, 100);
            $userId = rand(1, 12);
            $key = $postId . '-' . $userId;
            if (isset($sharePairs[$key])) continue;
            $sharePairs[$key] = true;
            $postShares[] = [
                'post_id' => $postId,
                'user_id' => $userId,
                'created_at' => $now,
            ];
        }
        DB::table('post_shares')->insert($postShares);



        // ===== Post Media =====
        $postImages = [];

        $realImages = [
            "https://images.unsplash.com/photo-1518791841217-8f162f1e1131",
            "https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d",
            "https://images.unsplash.com/photo-1494790108377-be9c29b29330",
            "https://images.unsplash.com/photo-1472214103451-9374bd1c798e",
            "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e",
            "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee",
            "https://images.unsplash.com/photo-1544005313-94ddf0286df2",
            "https://images.unsplash.com/photo-1517841905240-472988babdf9",
            "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df",
            "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91"
        ];

        for ($i = 1; $i <= 100; $i++) {
            $pastDate = fake()->dateTimeBetween('-1 year', 'now');
            $postImages[] = [
                'post_id' => rand(1, 10),
                'url' => $realImages[array_rand($realImages)] . "?auto=format&fit=crop&w=1024&q=80",
                'created_at' => $pastDate,
                'updated_at' => $pastDate,
            ];
        }

        DB::table('post_media')->insert($postImages);

        // ================================================================
// ====================== SURVEY SEEDER ===========================
// ================================================================

        // ---- 1. Fixed Categories (so IDs are predictable) ----
        $categoryNames = [
            'Student Life',
            'Course Feedback',
            'Campus Facilities',
            'Event Satisfaction',
            'Academic Support'
        ];
        $categoryIds = [];
        foreach ($categoryNames as $idx => $name) {
            $id = $idx + 1; // 1-based, matches your SMALLINT PK
            DB::table('categories')->updateOrInsert(
                ['id' => $id],
                [
                    'name' => $name,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]
            );
            $categoryIds[] = $id;
        }

        // ---- 2. Helper: pick random users (exclude admin if you want) ----
        $allUserIds = range(1, 12); // 10 random + 2 test users
        $studentUserIds = DB::table('users')
            ->where('role', 'student')
            ->pluck('id')
            ->toArray();

        // ---- 3. Survey definitions (easy to read & tweak) ----
        $surveyTemplates = [
            // ── Surveys (type = survey) ─────────────────────────────────────
            [
                'title' => 'End-of-Semester Student Life Survey',
                'type' => 'survey',
                'object' => 'students',
                'category_id' => $categoryIds[0],
                'questions' => [
                    ['type' => 'text', 'text' => 'What do you like most about campus life?', 'points' => 0],
                    [
                        'type' => 'single_choice',
                        'text' => 'How satisfied are you with dorms?',
                        'points' => 0,
                        'options' => ['Very Satisfied', 'Satisfied', 'Neutral', 'Dissatisfied', 'Very Dissatisfied']
                    ],
                    [
                        'type' => 'multiple_choice',
                        'text' => 'Which campus events did you attend?',
                        'points' => 0,
                        'options' => ['Career Fair', 'Cultural Fest', 'Hackathon', 'Sports Day', 'None']
                    ],
                ],
            ],
            [
                'title' => 'Course Feedback – CS101',
                'type' => 'survey',
                'object' => 'students',
                'category_id' => $categoryIds[1],
                'questions' => [
                    [
                        'type' => 'single_choice',
                        'text' => 'Was the pace of the course appropriate?',
                        'points' => 0,
                        'options' => ['Too Fast', 'Just Right', 'Too Slow']
                    ],
                    ['type' => 'text', 'text' => 'Any suggestions for the instructor?', 'points' => 0],
                ],
            ],

            // ── Quizzes (type = quiz) ───────────────────────────────────────
            [
                'title' => 'PHP Basics Quiz',
                'type' => 'quiz',
                'object' => 'students',
                'category_id' => $categoryIds[1],
                'points' => 10,
                'questions' => [
                    [
                        'type' => 'single_choice',
                        'text' => 'What does PHP stand for?',
                        'points' => 2,
                        'options' => ['Personal Home Page', 'PHP: Hypertext Preprocessor', 'Private Host Protocol'],
                        'correct' => 1
                    ],
                    [
                        'type' => 'multiple_choice',
                        'text' => 'Which are superglobals?',
                        'points' => 3,
                        'options' => ['$_GET', '$_POST', '$_SESSION', '$GLOBALS', '$_LOCAL'],
                        'correct' => [0, 1, 2, 3]
                    ],
                ],
            ],
            [
                'title' => 'Campus Safety Quiz',
                'type' => 'quiz',
                'object' => 'public',
                'category_id' => $categoryIds[2],
                'points' => 5,
                'questions' => [
                    [
                        'type' => 'single_choice',
                        'text' => 'Where is the nearest emergency exit?',
                        'points' => 2,
                        'options' => ['Left corridor', 'Right corridor', 'Behind cafeteria'],
                        'correct' => 0
                    ],
                    ['type' => 'text', 'text' => 'Name one safety tip you learned today.', 'points' => 1],
                ],
            ],
        ];

        // Add a few more random surveys to reach ~8 total
        for ($i = count($surveyTemplates) + 1; $i <= 8; $i++) {
            $surveyTemplates[] = [
                'title' => "Random Survey #$i",
                'type' => ['survey', 'quiz'][rand(0, 1)],
                'object' => ['public', 'students', 'lecturers'][rand(0, 2)],
                'category_id' => $faker->randomElement($categoryIds),
                'points' => rand(0, 15),
                'questions' => [
                    [
                        'type' => 'single_choice',
                        'text' => "Random Q1 for S#$i",
                        'points' => 0,
                        'options' => ['A', 'B', 'C', 'D']
                    ],
                    ['type' => 'text', 'text' => "Any comments for S#$i?", 'points' => 0],
                ],
            ];
        }

        // ---- 4. Insert Surveys + Questions + Options + Answers ----
        $surveyIds = [];

        foreach ($surveyTemplates as $tmpl) {
            $start = $now->copy()->addDays(rand(-30, 30));
            $end = $start->copy()->addDays(rand(7, 60));

            $surveyId = DB::table('surveys')->insertGetId([
                'title' => $tmpl['title'],
                'description' => $faker->paragraph(2),
                'categories_id' => $tmpl['category_id'],
                'type' => $tmpl['type'],
                'start_at' => $start,
                'end_at' => $end,
                'time_limit' => $tmpl['type'] === 'quiz' ? rand(10, 30) : null,
                'points' => $tmpl['points'] ?? 0,
                'object' => $tmpl['object'],
                'created_by' => rand(1, 10),
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            $surveyIds[] = $surveyId;

            // ----- Questions -----
            $questionIds = [];
            foreach ($tmpl['questions'] as $qData) {
                $questionId = DB::table('survey_questions')->insertGetId([
                    'survey_id' => $surveyId,
                    'question_text' => $qData['text'],
                    'question_type' => $qData['type'],
                    'points' => $qData['points'],
                ]);

                $questionIds[] = ['id' => $questionId, 'data' => $qData];

                // ----- Options (only for choice questions) -----
                if (in_array($qData['type'], ['single_choice', 'multiple_choice'])) {
                    $options = $qData['options'];
                    $correctIndices = $qData['correct'] ?? [];

                    foreach ($options as $idx => $optText) {
                        DB::table('survey_options')->insert([
                            'question_id' => $questionId,
                            'option_text' => $optText,
                            'is_correct' => in_array($idx, (array) $correctIndices),
                        ]);
                    }
                }
            }

            // ----- Answers (exactly 5 users answer ALL questions in this survey) -----
            $answeredUserIds = (array) $faker->randomElements($studentUserIds, 5);

            foreach ($answeredUserIds as $userId) {
                $answeredAt = $faker->dateTimeBetween($start, $end);

                // Each user answers ALL questions in this survey
                foreach ($questionIds as $qInfo) {
                    $questionId = $qInfo['id'];
                    $qData = $qInfo['data'];

                    if ($qData['type'] === 'text') {
                        DB::table('survey_answers')->insert([
                            'question_id' => $questionId,
                            'user_id' => $userId,
                            'answer_text' => $faker->sentences(rand(1, 3), true),
                            'answered_at' => $answeredAt,
                            'score' => 0,
                        ]);
                    } else {
                        // Pick random option(s)
                        $optionIds = DB::table('survey_options')
                            ->where('question_id', $questionId)
                            ->pluck('id')
                            ->toArray();

                        if ($qData['type'] === 'single_choice') {
                            $selected = $faker->randomElement($optionIds);
                            $isCorrect = DB::table('survey_options')
                                ->where('id', $selected)
                                ->value('is_correct');

                            DB::table('survey_answers')->insert([
                                'question_id' => $questionId,
                                'user_id' => $userId,
                                'selected_option_id' => $selected,
                                'answered_at' => $answeredAt,
                                'score' => $isCorrect ? $qData['points'] : 0,
                            ]);
                        } else { // multiple_choice – store one row per selected option
                            $selectedCount = rand(1, min(3, count($optionIds)));
                            $chosen = $faker->randomElements($optionIds, $selectedCount);

                            foreach ($chosen as $optId) {
                                $isCorrect = DB::table('survey_options')
                                    ->where('id', $optId)
                                    ->value('is_correct');

                                DB::table('survey_answers')->insert([
                                    'question_id' => $questionId,
                                    'user_id' => $userId,
                                    'selected_option_id' => $optId,
                                    'answered_at' => $answeredAt,
                                    'score' => $isCorrect ? ($qData['points'] / count((array) $qData['correct'])) : 0,
                                ]);
                            }
                        }
                    }
                }
            }
        }

        // End of Survey Seeder
        // ================================================================
// ================================================================

// ===== Join Requests =====
        $statuses = ['pending', 'approved', 'rejected'];

        for ($i = 0; $i < 20; $i++) {
            DB::table('join_requests')->insert([
                'user_id' => rand(1, 10),
                'group_id' => rand(1, 10),
                'status' => $statuses[array_rand($statuses)],
                'created_by' => rand(1, 10),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}