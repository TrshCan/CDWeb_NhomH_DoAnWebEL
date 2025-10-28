<?php

namespace App\Services;

use App\Models\Survey;
use App\Repositories\SurveyRepository;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Exception;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;



class SurveyService
{
    protected $repository;

    public function __construct(SurveyRepository $repository)
    {
        $this->repository = $repository;
    }

    public function createSurvey(array $data): Survey
    {
        // Gán giá trị mặc định theo schema
        $data = array_merge([
            'type' => 'survey',
            'object' => 'public',
            'points' => 0,
        ], $data);

        // Validation với thông báo lỗi tiếng Việt (nếu cần)
        $validator = Validator::make($data, [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'categories_id' => 'required|integer|exists:categories,id',
            'type' => 'sometimes|in:survey,quiz',
            'start_at' => 'nullable|date',
            'end_at' => 'nullable|date|after_or_equal:start_at',
            'time_limit' => 'nullable|integer|min:0',
            'points' => 'sometimes|integer|min:0',
            'object' => 'sometimes|in:public,students,lecturers',
            'created_by' => 'required|exists:users,id',
        ], [
            'title.required' => 'Tiêu đề là bắt buộc.',
            'title.string' => 'Tiêu đề phải là chuỗi ký tự.',
            'title.max' => 'Tiêu đề không được vượt quá 255 ký tự.',
            'categories_id.required' => 'Danh mục là bắt buộc.',
            'categories_id.exists' => 'Danh mục không tồn tại.',
            'created_by.required' => 'Người tạo là bắt buộc.',
            'created_by.exists' => 'Người tạo không tồn tại.',
            'type.in' => 'Loại khảo sát phải là "survey" hoặc "quiz".',
            'end_at.after_or_equal' => 'Ngày kết thúc phải sau hoặc bằng ngày bắt đầu.',
            'time_limit.min' => 'Thời gian giới hạn phải lớn hơn hoặc bằng 0.',
            'points.min' => 'Điểm phải lớn hơn hoặc bằng 0.',
            'object.in' => 'Đối tượng phải là "public", "students" hoặc "lecturers".',
        ]);

        if ($validator->fails()) {
            throw new ValidationException($validator);
        }

        try {
            DB::beginTransaction();
            $survey = $this->repository->create($data);
            DB::commit();
            return $survey;
        } catch (ModelNotFoundException $e) {
            DB::rollBack();
            Log::error('Error creating survey: ' . $e->getMessage(), ['data' => $data]);
            throw new Exception('Danh mục hoặc người dùng không tồn tại.', 404, $e);
        } catch (Exception $e) {
            DB::rollBack();
            Log::error('Error creating survey: ' . $e->getMessage(), ['data' => $data]);
            throw new Exception('Không thể tạo khảo sát.', 500, $e);
        }
    }
}