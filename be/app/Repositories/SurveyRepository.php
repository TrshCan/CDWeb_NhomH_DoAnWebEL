<?php

namespace App\Repositories;

use App\Models\Survey;
use Illuminate\Support\Facades\DB;

class SurveyRepository
{
    public function getByCreatorWithResponseCounts(int $createdBy)
    {
        // Count answers joined through questions per survey
        return Survey::query()
            ->select([
                'surveys.id',
                'surveys.title',
                'surveys.created_at',
                'surveys.end_at',
                DB::raw('COALESCE(COUNT(survey_answers.id), 0) as responses'),
            ])
            ->leftJoin('survey_questions', 'survey_questions.survey_id', '=', 'surveys.id')
            ->leftJoin('survey_answers', 'survey_answers.question_id', '=', 'survey_questions.id')
            ->where('surveys.created_by', $createdBy)
            ->groupBy('surveys.id', 'surveys.title', 'surveys.created_at', 'surveys.end_at')
            ->orderByDesc('surveys.created_at')
            ->get();
    }
}


