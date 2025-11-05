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
            DB::table('users')->insert(array_merge($u, [
                'email_verified_at' => $now,
                'remember_token' => Str::random(10),
                'ban_reason' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ]));
        }

        // ----- 2 **known** test accounts -----
        $testUsers = [
            [
                'name' => 'Test Admin',
                'email' => 'admin@test.com',
                'password' => bcrypt('admin123'),   // <-- you know the plain text
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
                'password' => bcrypt('student123'), // <-- you know the plain text
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
            DB::table('users')->insert(array_merge($u, [
                'email_verified_at' => $now,
                'remember_token' => Str::random(10),
                'ban_reason' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ]));
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
                'deadline_date' => $futureDate->format('Y-m-d'),
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
                'created_by' => $faker->randomElement($allUserIds),
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            $surveyIds[] = $surveyId;

            // ----- Questions -----
            foreach ($tmpl['questions'] as $qData) {
                $questionId = DB::table('survey_questions')->insertGetId([
                    'survey_id' => $surveyId,
                    'question_text' => $qData['text'],
                    'question_type' => $qData['type'],
                    'points' => $qData['points'],
                ]);

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

                // ----- Answers (simulate 3–8 users answering) -----
                $answerCount = rand(3, 8);
                $answeredUserIds = (array) $faker->randomElements($allUserIds, $answerCount);

                foreach ($answeredUserIds as $userId) {
                    $answeredAt = $faker->dateTimeBetween($start, $end);

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

                            $earned = 0;
                            foreach ($chosen as $optId) {
                                $isCorrect = DB::table('survey_options')
                                    ->where('id', $optId)
                                    ->value('is_correct');
                                if ($isCorrect)
                                    $earned += $qData['points'] / count((array) $qData['correct']);

                                DB::table('survey_answers')->insert([
                                    'question_id' => $questionId,
                                    'user_id' => $userId,
                                    'selected_option_id' => $optId,
                                    'answered_at' => $answeredAt,
                                    'score' => 0, // score calculated later if needed
                                ]);
                            }
                            // Optional: update a total score row – omitted for simplicity
                        }
                    }
                }
            }
        }

        // End of Survey Seeder
        // ================================================================
    }
}
