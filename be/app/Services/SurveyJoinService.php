<?php

namespace App\Services;

use App\Models\Survey;
use App\Models\User;
use App\Repositories\SurveyJoinRepository;
use Illuminate\Support\Facades\DB;

class SurveyJoinService
{
    protected $repository;

    public function __construct(SurveyJoinRepository $repository)
    {
        $this->repository = $repository;
    }

    public function getSurveyDetail(int $surveyId): ?array
    {
        $survey = $this->repository->getSurveyWithQuestionsAndOptions($surveyId);

        if (!$survey) return null;

        return [
            'id' => $survey->id,
            'title' => $survey->title,
            'description' => $survey->description,
            'time_limit' => $survey->time_limit,
            'total_points' => $survey->questions->sum('points'),
            'questions' => $survey->questions->map(function ($question) {
                return [
                    'id' => $question->id,
                    'question_text' => $question->question_text,
                    'question_type' => $question->question_type,
                    'points' => $question->points,
                    'options' => $question->options->map(fn($opt) => [
                        'id' => $opt->id,
                        'option_text' => $opt->option_text
                    ])
                ];
            })
        ];
    }

    public function submitAnswers(int $surveyId, array $answersInput, User $user): array
    {
        return DB::transaction(function () use ($surveyId, $answersInput, $user) {
            $survey = $this->repository->getSurveyWithQuestionsAndOptions($surveyId);
            if (!$survey) {
                throw new \Exception('Survey not found');
            }
            $questions = $survey->questions->keyBy('id');

            $answersByQuestion = collect($answersInput)
                ->filter(fn($ans) => isset($ans['question_id']) && $questions->has($ans['question_id']))
                ->groupBy('question_id');

            if ($answersByQuestion->isEmpty()) {
                throw new \Exception('No valid answers provided');
            }

            $questionIds = $questions->keys()->all();
            $this->repository->deleteOldAnswers($user->id, $questionIds);

            $totalScore = 0;
            $maxScore = $questions->sum('points');

            foreach ($questions as $questionId => $question) {
                $questionAnswers = $answersByQuestion->get($questionId);
                if (!$questionAnswers) continue;

                [$score, $selectedOptionId, $selectedOptionIds, $answerText] = 
                    $this->processQuestionAnswer($question, $questionAnswers);

                $answer = $this->repository->createAnswer([
                    'question_id' => $questionId,
                    'user_id' => $user->id,
                    'selected_option_id' => $selectedOptionId,
                    'answer_text' => $answerText,
                    'answered_at' => now(),
                    'score' => $score
                ]);

                if ($question->question_type === 'multiple_choice' && !empty($selectedOptionIds)) {
                    $this->repository->createAnswerOptions(
                        $this->formatAnswerOptions($answer->id, $selectedOptionIds)
                    );
                }

                $totalScore += $score;
            }

            $this->repository->updateOrCreateResult(
                ['survey_id' => $surveyId, 'user_id' => $user->id],
                ['total_score' => $totalScore, 'max_score' => $maxScore, 'status' => 'completed']
            );

            return [
                'total_score' => $totalScore,
                'max_score' => $maxScore,
                'score_percentage' => $maxScore > 0 ? round(($totalScore / $maxScore) * 100, 2) : null
            ];
        });
    }

    private function processQuestionAnswer(Survey $question, $answers): array
    {
        $score = 0;
        $selectedOptionId = null;
        $selectedOptionIds = [];
        $answerText = null;

        switch ($question->question_type) {
            case 'text':
                $answerText = $answers->pluck('answer_text')->filter()->first();
                break;
                
            case 'single_choice':
                $selectedOptionId = $answers->pluck('selected_option_id')->filter()->first();
                if ($selectedOptionId && $option = $question->options->find($selectedOptionId)) {
                    $score = $option->is_correct ? $question->points : 0;
                }
                break;
                
            case 'multiple_choice':
                $selectedOptionIds = $answers->pluck('selected_option_id')->filter()->unique()->values();
                $correctIds = $question->options->where('is_correct', true)->pluck('id');
                
                if ($selectedOptionIds->count() === $correctIds->count() && 
                    $selectedOptionIds->diff($correctIds)->isEmpty()) {
                    $score = $question->points;
                }
                break;
        }

        return [$score, $selectedOptionId, $selectedOptionIds, $answerText];
    }

    private function formatAnswerOptions(int $answerId, $optionIds): array
    {
        $now = now();
        return $optionIds->map(fn($id) => [
            'answer_id' => $answerId,
            'option_id' => $id,
            'created_at' => $now,
            'updated_at' => $now
        ])->toArray();
    }
}
