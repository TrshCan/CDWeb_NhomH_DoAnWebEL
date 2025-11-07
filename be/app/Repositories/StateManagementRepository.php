<?php

namespace App\Repositories;

use App\Models\Survey;
use Illuminate\Database\Eloquent\ModelNotFoundException;

class StateManagementRepository
{
    public function find($id): Survey
    {
        return Survey::findOrFail($id);
    }

    public function updateStatus($id, string $status): Survey
    {
        $survey = Survey::findOrFail($id);
        $survey->status = $status;
        $survey->save();
        return $survey;
    }

    public function updateReviewPermission($id, bool $allowReview): Survey
    {
        $survey = Survey::findOrFail($id);
        $survey->allow_review = $allowReview;
        $survey->save();
        return $survey;
    }
}