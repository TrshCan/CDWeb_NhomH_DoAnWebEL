<?php

namespace App\GraphQL\Resolvers;

use App\Models\Survey;
use App\Models\SurveyAnswer;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class SurveyJoinResolver
{
    public function surveyJoinDetail($rootValue, array $args)
    {
        $surveyId = $args['surveyId'];
        
        $survey = Survey::with(['questions.options'])
            ->where('id', $surveyId)
            ->first();

        if (!$survey) {
            return null;
        }

        $totalPoints = $survey->questions->sum('points');

        return [
            'id' => $survey->id,
            'title' => $survey->title,
            'description' => $survey->description,
            'time_limit' => $survey->time_limit,
            'total_points' => $totalPoints,
            'questions' => $survey->questions->map(function ($question) {
                return [
                    'id' => $question->id,
                    'question_text' => $question->question_text,
                    'question_type' => $question->question_type,
                    'points' => $question->points,
                    'options' => $question->options->map(function ($option) {
                        return [
                            'id' => $option->id,
                            'option_text' => $option->option_text,
                        ];
                    }),
                ];
            }),
        ];
    }

    public function submitSurveyAnswers($rootValue, array $args)
    {
        $surveyId = $args['surveyId'];
        $answers = $args['answers'];
        $userId = Auth::id();

        if (!$userId) {
            return [
                'success' => false,
                'message' => 'User not authenticated',
                'total_score' => null,
                'max_score' => null,
                'score_percentage' => null,
            ];
        }

        $survey = Survey::with('questions.options')->find($surveyId);
        
        if (!$survey) {
            return [
                'success' => false,
                'message' => 'Survey not found',
                'total_score' => null,
                'max_score' => null,
                'score_percentage' => null,
            ];
        }

        DB::beginTransaction();
        
        try {
            $totalScore = 0;
            $maxScore = 0;

            foreach ($answers as $answer) {
                $question = $survey->questions->firstWhere('id', $answer['question_id']);
                
                if (!$question) {
                    continue;
                }

                $maxScore += $question->points ?? 0;
                $score = 0;

                if ($question->question_type === 'text') {
                    $score = 0;
                } else {
                    $selectedOption = $question->options->firstWhere('id', $answer['selected_option_id'] ?? null);
                    if ($selectedOption && $selectedOption->is_correct) {
                        $score = $question->points ?? 0;
                    }
                }

                $totalScore += $score;

                SurveyAnswer::create([
                    'question_id' => $answer['question_id'],
                    'user_id' => $userId,
                    'selected_option_id' => $answer['selected_option_id'] ?? null,
                    'answer_text' => $answer['answer_text'] ?? null,
                    'answered_at' => now(),
                    'score' => $score,
                ]);
            }

            DB::commit();

            $scorePercentage = $maxScore > 0 ? ($totalScore / $maxScore) * 100 : 0;

            return [
                'success' => true,
                'message' => 'Survey submitted successfully',
                'total_score' => $totalScore,
                'max_score' => $maxScore,
                'score_percentage' => $scorePercentage,
            ];

        } catch (\Exception $e) {
            DB::rollBack();
            
            return [
                'success' => false,
                'message' => 'Failed to submit survey: ' . $e->getMessage(),
                'total_score' => null,
                'max_score' => null,
                'score_percentage' => null,
            ];
        }
    }
}
