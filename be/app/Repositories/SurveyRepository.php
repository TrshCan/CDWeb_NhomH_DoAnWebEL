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

    public function getRawDataBySurveyId(int $surveyId)
    {
        // Get unique responses per user for a survey
        // Group by user_id to get one response per user
        // Join with users and faculties to get user info
        return DB::table('survey_answers')
            ->select([
                'users.id as user_id',
                'users.name as student_name',
                'users.email as student_email',
                'faculties.name as faculty_name',
                'survey_questions.survey_id',
                DB::raw('MAX(survey_answers.answered_at) as completed_date'),
                DB::raw('CONCAT(survey_questions.survey_id, "-", survey_answers.user_id) as response_id'),
            ])
            ->join('survey_questions', 'survey_questions.id', '=', 'survey_answers.question_id')
            ->join('users', 'users.id', '=', 'survey_answers.user_id')
            ->leftJoin('faculties', 'faculties.id', '=', 'users.faculty_id')
            ->where('survey_questions.survey_id', $surveyId)
            ->whereNull('survey_answers.deleted_at')
            ->groupBy('users.id', 'users.name', 'users.email', 'faculties.name', 'survey_questions.survey_id')
            ->orderByDesc('completed_date')
            ->get();
    }

    public function getSurveyTitle(int $surveyId)
    {
        return Survey::query()
            ->where('id', $surveyId)
            ->value('title');
    }
}


