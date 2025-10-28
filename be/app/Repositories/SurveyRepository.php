<?php

namespace App\Repositories;

use App\Models\Survey;

class SurveyRepository
{
    protected $model;

    public function __construct(Survey $survey)
    {
        $this->model = $survey;
    }

    public function create(array $data): Survey
    {
        // Validation đã được xử lý ở SurveyService, nên chỉ tạo record
        return $this->model->create($data);
    }
    
    // 🆕 Thêm hàm lấy danh sách khảo sát (có phân trang)
    public function getAllPaginated(int $perPage = 10)
    {
        return Survey::with(['category', 'creator'])
            ->orderByDesc('created_at')
            ->paginate($perPage);
    }
    public function findById(int $id): ?Survey
{
    return Survey::find($id);
}

    
}