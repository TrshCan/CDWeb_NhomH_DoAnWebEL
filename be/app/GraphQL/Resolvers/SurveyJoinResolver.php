<?php

namespace App\GraphQL\Resolvers;

use App\Models\Survey;
use App\Models\SurveyAnswer;
use App\Models\SurveyAnswerOption;
use App\Models\SurveyResult;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

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
        $surveyId = (int) ($args['surveyId'] ?? 0);
        $answersInput = $args['answers'] ?? [];
        $token = request()->bearerToken();

        if (!$token) {
            return [
                'success' => false,
                'message' => 'User not authenticated',
                'total_score' => null,
                'max_score' => null,
                'score_percentage' => null,
            ];
        }

        $user = User::where('remember_token', $token)->first();

        if (!$user) {
            return [
                'success' => false,
                'message' => 'Invalid or expired token',
                'total_score' => null,
                'max_score' => null,
                'score_percentage' => null,
            ];
        }

        $userId = $user->id;

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

        $questions = $survey->questions->keyBy('id');
        if ($questions->isEmpty()) {
            return [
                'success' => false,
                'message' => 'Survey has no questions',
                'total_score' => null,
                'max_score' => null,
                'score_percentage' => null,
            ];
        }

        $answersByQuestion = collect($answersInput)
            ->map(function ($answer) {
                return [
                    'question_id' => isset($answer['question_id']) ? (int) $answer['question_id'] : 0,
                    'selected_option_id' => $answer['selected_option_id'] ?? null,
                    'answer_text' => array_key_exists('answer_text', $answer)
                        ? trim((string) $answer['answer_text'])
                        : null,
                ];
            })
            ->filter(fn($answer) => $answer['question_id'] > 0)
            ->filter(function ($answer) use ($questions) {
                return $questions->has($answer['question_id']);
            })
            ->groupBy('question_id');

        if ($answersByQuestion->isEmpty()) {
            return [
                'success' => false,
                'message' => 'No valid answers provided',
                'total_score' => null,
                'max_score' => null,
                'score_percentage' => null,
            ];
        }

        DB::beginTransaction();

        try {
            $totalScore = 0;
            $maxScore = (int) $questions->sum(function ($question) {
                return (int) ($question->points ?? 0);
            });

            // Remove old answers for this user & survey to allow resubmission
            SurveyAnswer::where('user_id', $userId)
                ->whereIn('question_id', $questions->keys()->all())
                ->forceDelete();

            foreach ($questions as $questionId => $question) {
                $questionAnswers = $answersByQuestion->get($questionId);
                if (!$questionAnswers) {
                    continue;
                }

                $questionPoints = (int) ($question->points ?? 0);
                $score = 0;
                $selectedOptionId = null;
                $selectedOptionIds = collect();
                $answerText = null;

                switch ($question->question_type) {
                    case 'text':
                        $answerText = $questionAnswers->pluck('answer_text')
                            ->filter(function ($text) {
                                return $text !== null && $text !== '';
                            })
                            ->first();
                        break;

                    case 'single_choice':
                        $selectedOptionId = $questionAnswers->pluck('selected_option_id')
                            ->filter()
                            ->map(fn($id) => (int) $id)
                            ->first();

                        if ($selectedOptionId) {
                            $selectedOption = $question->options->firstWhere('id', $selectedOptionId);
                            if ($selectedOption && $selectedOption->is_correct) {
                                $score = $questionPoints;
                            }
                        }
                        break;

                    case 'multiple_choice':
                        $selectedOptionIds = $questionAnswers->pluck('selected_option_id')
                            ->filter()
                            ->map(fn($id) => (int) $id)
                            ->unique()
                            ->values();

                        if ($selectedOptionIds->isNotEmpty()) {
                            $correctOptionIds = $question->options
                                ->where('is_correct', true)
                                ->pluck('id')
                                ->map(fn($id) => (int) $id)
                                ->unique()
                                ->values();

                            if (
                                $correctOptionIds->isNotEmpty()
                                && $selectedOptionIds->count() === $correctOptionIds->count()
                                && $selectedOptionIds->diff($correctOptionIds)->isEmpty()
                            ) {
                                $score = $questionPoints;
                            }
                        }
                        break;

                    default:
                        // Unsupported type yet, keep default score = 0
                        break;
                }

                $answer = SurveyAnswer::create([
                    'question_id' => $questionId,
                    'user_id' => $userId,
                    'selected_option_id' => $question->question_type === 'single_choice' ? $selectedOptionId : null,
                    'answer_text' => $answerText,
                    'answered_at' => now(),
                    'score' => $score,
                ]);

                if ($question->question_type === 'multiple_choice' && $selectedOptionIds->isNotEmpty()) {
                    $timestamps = now();
                    $rows = $selectedOptionIds->map(fn($optionId) => [
                        'answer_id' => $answer->id,
                        'option_id' => $optionId,
                        'created_at' => $timestamps,
                        'updated_at' => $timestamps,
                    ])->all();

                    SurveyAnswerOption::insert($rows);
                }

                $totalScore += $score;
            }

            SurveyResult::updateOrCreate(
                [
                    'survey_id' => $surveyId,
                    'user_id' => $userId,
                ],
                [
                    'total_score' => $totalScore,
                    'max_score' => $maxScore,
                    'status' => 'completed',
                ]
            );

            DB::commit();

            $scorePercentage = $maxScore > 0 ? round(($totalScore / $maxScore) * 100, 2) : null;

            return [
                'success' => true,
                'message' => 'Survey submitted successfully',
                'total_score' => $totalScore,
                'max_score' => $maxScore,
                'score_percentage' => $scorePercentage,
            ];

        } catch (\Throwable $e) {
            DB::rollBack();
            \Log::error("Survey submit failed: " . $e->getMessage(), [
                'line' => $e->getLine(),
                'file' => $e->getFile(),
                'trace' => $e->getTraceAsString()
            ]);

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
