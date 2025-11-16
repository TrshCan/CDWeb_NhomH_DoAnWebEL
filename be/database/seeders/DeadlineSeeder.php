<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Deadline;
use App\Models\User;
use Carbon\Carbon;

class DeadlineSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Lấy danh sách user id để gán created_by
        $userIds = User::pluck('id')->toArray();

        // Nếu chưa có user nào, tạo 1 user mẫu
        if (empty($userIds)) {
            $user = User::factory()->create();
            $userIds = [$user->id];
        }

        // Danh sách deadline mẫu
        $deadlines = [
            [
                'title' => 'Complete Project Proposal',
                'deadline_date' => Carbon::today()->addDays(7),
                'details' => 'Draft and finalize the project proposal for the new client.',
                'created_at' => Carbon::now(),
                'created_by' => $userIds[array_rand($userIds)],
            ],
            [
                'title' => 'Submit Quarterly Report',
                'deadline_date' => Carbon::today()->addDays(14),
                'details' => 'Compile and submit the Q3 financial report.',
                'created_at' => Carbon::now(),
                'created_by' => $userIds[array_rand($userIds)],
            ],
            [
                'title' => 'Team Meeting Preparation',
                'deadline_date' => Carbon::today()->addDays(3),
                'details' => null, // nullable
                'created_at' => Carbon::now(),
                'created_by' => $userIds[array_rand($userIds)],
            ],
            [
                'title' => 'Client Feedback Review',
                'deadline_date' => Carbon::today()->addDays(10),
                'details' => 'Review client feedback and prepare action items.',
                'created_at' => Carbon::now(),
                'created_by' => $userIds[array_rand($userIds)],
            ],
        ];

        // Do bảng không có updated_at nên ta tắt timestamps
        foreach ($deadlines as $deadline) {
            Deadline::insert($deadline);
        }
    }
}