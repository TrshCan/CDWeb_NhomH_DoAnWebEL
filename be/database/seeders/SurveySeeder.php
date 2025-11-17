<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Category;
use App\Models\Survey;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class SurveySeeder extends Seeder
{
    public function run(): void
    {
        // Tạo status mẫu nếu chưa có
        $statusId = DB::table('statuses')->insertGetId([
            'name' => 'active',
            'reason' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        
        // Tạo category mẫu
        $category = Category::firstOrCreate(
            ['id' => 1],
            ['name' => 'Khảo sát chung']
        );
        
        // Lấy user đầu tiên hoặc tạo mới
        $user = User::first();
        if (!$user) {
            $user = User::create([
                'name' => 'Admin',
                'email' => 'admin@example.com',
                'password' => bcrypt('password'),
                'status_id' => $statusId,
                'role' => 'admin',
            ]);
        }
        
        // Tạo survey mẫu
        Survey::create([
            'title' => 'Khảo sát mẫu',
            'description' => 'Đây là khảo sát mẫu để test',
            'categories_id' => $category->id,
            'type' => 'survey',
            'object' => 'public',
            'status' => 'active',
            'points' => 0,
            'allow_review' => false,
            'created_by' => $user->id,
        ]);
    }
}
