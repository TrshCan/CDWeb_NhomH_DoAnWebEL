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
        // 🆕 Cập nhật khảo sát
      public function update(Survey $survey, array $data): Survey
    {
        $survey->update($data);
        return $survey->fresh(); // đảm bảo return bản ghi mới nhất
    }
    
    // 🆕 Thêm hàm lấy danh sách khảo sát (có phân trang và filter)
    public function getAllPaginated(int $perPage = 10, array $filters = [])
    {
        $query = Survey::with(['category', 'creator'])
            ->leftJoin('users as u', 'u.id', '=', 'surveys.created_by')
            ->select('surveys.*')
            ->addSelect(['creator_name' => \DB::raw('u.name')]);

        // Áp dụng filters
        if (!empty($filters['categories_id'])) {
            $query->where('categories_id', $filters['categories_id']);
        }

        if (!empty($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['keyword'])) {
            $keyword = '%' . $filters['keyword'] . '%';
            $query->where(function ($q) use ($keyword) {
                $q->where('title', 'like', $keyword)
                  ->orWhere('description', 'like', $keyword);
            });
        }

        if (!empty($filters['created_by'])) {
            $query->where('created_by', $filters['created_by']);
        }

        if (!empty($filters['creator_name'])) {
            $name = '%' . $filters['creator_name'] . '%';
            $query->whereHas('creator', function ($q) use ($name) {
                $q->where('name', 'like', $name);
            });
        }

        return $query->orderByDesc('created_at')->paginate($perPage);
    }
    public function findById(int $id): ?Survey
{
    return Survey::find($id);
}

    
}