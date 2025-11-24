<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;

class SurveySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('surveys')->insert([
            [
                'title' => 'Khảo sát chất lượng giảng dạy học kỳ 1',
                'description' => 'Đánh giá chất lượng giảng dạy của giảng viên trong học kỳ 1 năm học 2025.',
                'categories_id' => 1,
                'type' => 'survey',
                'start_at' => Carbon::now()->subDays(10),
                'end_at' => Carbon::now()->addDays(10),
                'time_limit' => 30,
                'points' => 0,
                'object' => 'students',
                'status' => 'active',
                'allow_review'  => false,
                'created_by' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'title' => 'Đánh giá cơ sở vật chất trường học',
                'description' => 'Khảo sát mức độ hài lòng của sinh viên về phòng học, thư viện, ký túc xá, và thiết bị học tập.',
                'categories_id' => 2,
                'type' => 'survey',
                'start_at' => Carbon::now()->subDays(5),
                'end_at' => Carbon::now()->addDays(15),
                'time_limit' => 20,
                'points' => 0,
                'object' => 'students',
                'status' => 'active',
                'allow_review'  => false,
                'created_by' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'title' => 'Khảo sát ý kiến sinh viên về chương trình học',
                'description' => 'Sinh viên đánh giá mức độ phù hợp và tính thực tiễn của chương trình đào tạo.',
                'categories_id' => 3,
                'type' => 'survey',
                'start_at' => Carbon::now(),
                'end_at' => Carbon::now()->addDays(30),
                'time_limit' => 25,
                'points' => 0,
                'object' => 'students',
                'status' => 'active',
                'allow_review'  => false,
                'created_by' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'title' => 'Khảo sát hoạt động ngoại khóa và câu lạc bộ',
                'description' => 'Đánh giá hiệu quả và mức độ hấp dẫn của các hoạt động ngoại khóa, câu lạc bộ sinh viên.',
                'categories_id' => 4,
                'type' => 'survey',
                'start_at' => Carbon::now()->subDays(3),
                'end_at' => Carbon::now()->addDays(7),
                'time_limit' => 15,
                'points' => 0,
                'object' => 'students',
                'status' => 'active',
                'allow_review'  => false,
                'created_by' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'title' => 'Khảo sát dịch vụ hỗ trợ sinh viên',
                'description' => 'Khảo sát mức độ hài lòng của sinh viên về các dịch vụ hỗ trợ học tập, tâm lý và hướng nghiệp.',
                'categories_id' => 5,
                'type' => 'survey',
                'start_at' => Carbon::now()->subDays(1),
                'end_at' => Carbon::now()->addDays(20),
                'time_limit' => 20,
                'points' => 0,
                'object' => 'students',
                'status' => 'active',
                'allow_review'  => false,
                'created_by' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
