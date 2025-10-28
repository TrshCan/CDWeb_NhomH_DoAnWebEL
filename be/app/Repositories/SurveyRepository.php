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
}