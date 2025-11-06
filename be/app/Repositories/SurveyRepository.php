<?php

namespace App\Repositories;

use App\Models\Survey;
use Illuminate\Support\Facades\DB;

class SurveyRepository
{
    public function getByCreatorWithResponseCounts(int $createdBy)
    {
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

    public function getCompletedByUser(int $userId)
    {
        // Distinct surveys that user answered any question on
        return Survey::query()
            ->select([
                'surveys.id',
                'surveys.title as name',
                DB::raw('MAX(survey_answers.answered_at) as completedAt'),
                DB::raw('users.name as creator'),
                'surveys.object',
            ])
            ->join('survey_questions', 'survey_questions.survey_id', '=', 'surveys.id')
            ->join('survey_answers', function ($join) use ($userId) {
                $join->on('survey_answers.question_id', '=', 'survey_questions.id')
                    ->where('survey_answers.user_id', '=', $userId);
            })
            ->leftJoin('users', 'users.id', '=', 'surveys.created_by')
            ->groupBy('surveys.id', 'surveys.title', 'users.name', 'surveys.object')
            ->orderByDesc(DB::raw('MAX(survey_answers.answered_at)'))
            ->get();
    }
}


