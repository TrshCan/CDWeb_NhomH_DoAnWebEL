<?php

namespace App\Repositories;

use App\Models\Survey;
use App\Models\SurveyAnswer;
use App\Models\SurveyAnswerOption;
use App\Models\SurveyResult;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;

class SurveyJoinRepository
{
    public function getSurveyWithQuestionsAndOptions(int $surveyId): ?Survey
    {
        return Survey::with(['questions.options'])->withTrashed()->find($surveyId);
    }

    public function getUserByToken(string $token): ?User
    {
        return User::where('remember_token', $token)->first();
    }

    public function deleteOldAnswers(int $userId, array $questionIds): void
    {
        SurveyAnswer::where('user_id', $userId)
            ->whereIn('question_id', $questionIds)
            ->delete();
    }

    public function createAnswer(array $answerData): SurveyAnswer
    {
        return SurveyAnswer::create($answerData);
    }

    public function createAnswerOptions(array $optionsData): void
    {
        SurveyAnswerOption::insert($optionsData);
    }

    public function updateOrCreateResult(array $attributes, array $values): SurveyResult
    {
        return SurveyResult::updateOrCreate($attributes, $values);
    }

    /**
     * Get the earliest answered_at timestamp for user's answers to questions in this survey
     */
    public function getEarliestAnswerTime(int $userId, array $questionIds): ?\Carbon\Carbon
    {
        $earliestAnswer = SurveyAnswer::where('user_id', $userId)
            ->whereIn('question_id', $questionIds)
            ->whereNotNull('answered_at')
            ->orderBy('answered_at', 'asc')
            ->first();

        return $earliestAnswer ? $earliestAnswer->answered_at : null;
    }

    /**
     * Check if user has already completed this survey
     */
    public function hasUserCompletedSurvey(int $userId, int $surveyId): bool
    {
        $result = SurveyResult::where('user_id', $userId)
            ->where('survey_id', $surveyId)
            ->where('status', 'completed')
            ->first();

        return $result !== null;
    }
}
