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
        return Survey::with(['questions.options'])->find($surveyId);
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
}
