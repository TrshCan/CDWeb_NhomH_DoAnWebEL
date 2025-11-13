<?php

namespace App\Repositories;

use App\Models\Survey;
use App\Models\SurveyAnswer;
use Illuminate\Support\Collection;
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
                'users.student_code',
                'users.name as student_name',
                'users.email as student_email',
                'faculties.name as faculty_name',
                'faculties.code as faculty_code',
                'survey_questions.survey_id',
                DB::raw('MAX(survey_answers.answered_at) as completed_date'),
                DB::raw('CONCAT(survey_questions.survey_id, "-", survey_answers.user_id) as response_id'),
            ])
            ->join('survey_questions', 'survey_questions.id', '=', 'survey_answers.question_id')
            ->join('users', 'users.id', '=', 'survey_answers.user_id')
            ->leftJoin('faculties', 'faculties.id', '=', 'users.faculty_id')
            ->where('survey_questions.survey_id', $surveyId)
            ->whereNull('survey_answers.deleted_at')
            ->groupBy('users.id', 'users.student_code', 'users.name', 'users.email', 'faculties.name', 'faculties.code', 'survey_questions.survey_id')
            ->orderByDesc('completed_date')
            ->get();
    }

    public function getSurveyTitle(int $surveyId)
    {
        return Survey::query()
            ->where('id', $surveyId)
            ->value('title');
    }

    public function findSurveyWithQuestions(int $surveyId): ?Survey
    {
        return Survey::query()
            ->with(['questions' => function ($query) {
                $query->orderBy('id')
                    ->with(['options' => function ($optionQuery) {
                        $optionQuery->orderBy('id');
                    }]);
            }])
            ->find($surveyId);
    }

    public function getAnswersForSurveyAndUser(int $surveyId, int $userId): Collection
    {
        return SurveyAnswer::query()
            ->where('user_id', $userId)
            ->whereIn('question_id', function ($query) use ($surveyId) {
                $query->select('id')
                    ->from('survey_questions')
                    ->where('survey_id', $surveyId);
            })
            ->with('selectedOption')
            ->orderBy('question_id')
            ->get();
    }

    public function getParticipantProfile(int $userId): ?object
    {
        return DB::table('users')
            ->select([
                'users.id',
                'users.name',
                'users.student_code',
                'users.email',
                'classes.name as class_name',
                'faculties.name as faculty_name',
            ])
            ->leftJoin('classes', 'classes.id', '=', 'users.class_id')
            ->leftJoin('faculties', 'faculties.id', '=', 'users.faculty_id')
            ->where('users.id', $userId)
            ->first();
    }

    public function getResponseIdsForSurvey(int $surveyId): array
    {
        return DB::table('survey_answers')
            ->selectRaw('CONCAT(survey_questions.survey_id, "-", survey_answers.user_id) as response_id')
            ->selectRaw('MAX(survey_answers.answered_at) as completed_at')
            ->join('survey_questions', 'survey_questions.id', '=', 'survey_answers.question_id')
            ->where('survey_questions.survey_id', $surveyId)
            ->whereNull('survey_answers.deleted_at')
            ->groupBy('survey_answers.user_id', 'survey_questions.survey_id')
            ->orderByDesc('completed_at')
            ->pluck('response_id')
            ->toArray();
    }
}

