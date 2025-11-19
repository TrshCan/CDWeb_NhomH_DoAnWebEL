<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Deadline;
use App\Models\User;
use Carbon\Carbon;

class DeadlineSeeder extends Seeder
{
    public function run(): void
    {
        // Lấy danh sách user id để gán created_by
        $userIds = User::pluck('id')->toArray();

        // Nếu chưa có user nào, tạo 1 user mẫu đảm bảo không lỗi FK
        if (empty($userIds)) {
            $newUser = User::factory()->create();
            $userIds = [$newUser->id];
        }

        $now = Carbon::now();

        $deadlines = [
            [
                'title' => 'Complete Project Proposal',
                'deadline_date' => Carbon::today()->addDays(7),
                'details' => 'Draft and finalize the project proposal for the new client.',
            ],
            [
                'title' => 'Submit Quarterly Report',
                'deadline_date' => Carbon::today()->addDays(14),
                'details' => 'Compile and submit the Q3 financial report.',
            ],
            [
                'title' => 'Team Meeting Preparation',
                'deadline_date' => Carbon::today()->addDays(3),
                'details' => null,
            ],
            [
                'title' => 'Client Feedback Review',
                'deadline_date' => Carbon::today()->addDays(10),
                'details' => 'Review the client feedback and prepare action items.',
            ],
        ];

        foreach ($deadlines as $deadline) {
            Deadline::create([
                'title'         => $deadline['title'],
                'deadline_date' => $deadline['deadline_date'],
                'details'       => $deadline['details'],
                'created_by'    => $userIds[array_rand($userIds)],
                'created_at'    => $now,
                'updated_at'    => $now,
                'deleted_at'    => null,
            ]);
        }
    }
}