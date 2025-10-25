<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Faker\Factory as Faker;
use Carbon\Carbon;

class EventSeeder extends Seeder
{
    public function run(): void
    {
        $faker = Faker::create();

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
            'Lecture Hall A', 'Campus Quad', 'Library Seminar Room', 'Student Union',
            'Science Building B-101', 'Sports Complex', 'Auditorium', 'Cafeteria',
            'Online (Zoom)', null, // Một vài sự kiện không có location
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

            // Tạo tiêu đề sự kiện
            $titleTemplate = $faker->randomElement($eventTitles);
            $title = str_replace(
                ['{club}', '{event_type}', '{culture}', '{sport}', '{topic}', '{tech_topic}', '{year}'],
                [$club, $eventType, $culture, $sport, $topic, $techTopic, $year],
                $titleTemplate
            );

            $events[] = [
                'title' => $title,
                'event_date' => $pastDate,
                'location' => $faker->randomElement($locations),
                'created_by' => rand(1, 10), // ID user tạo event (đảm bảo có user id 1–10)
                'created_at' => $pastDate,
            ];
        }

        // Insert một lần cho hiệu suất
        DB::table('events')->insert($events);
    }
}