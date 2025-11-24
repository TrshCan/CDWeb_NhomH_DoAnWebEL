<?php

namespace App\Services;

use App\Models\Survey;
use App\Models\User;
use App\Repositories\SurveyJoinRepository;
use App\Repositories\SurveyShareRepository;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class SurveyJoinService
{
    protected $repository;
    protected $shareRepository;

    public function __construct(
        SurveyJoinRepository $repository,
        SurveyShareRepository $shareRepository
    ) {
        $this->repository = $repository;
        $this->shareRepository = $shareRepository;
    }

    public function getSurveyDetail(int $surveyId, ?string $token = null): ?array
    {
        if (empty($token)) {
            throw new \Exception('Join token is required');
        }

        try {
            $share = $this->shareRepository->findByToken($token);
        } catch (ModelNotFoundException $e) {
            throw new \Exception('Invalid or expired join token');
        }

        if ((int) $share->survey_id !== $surveyId) {
            throw new \Exception('Join token does not match this survey');
        }

        $survey = $this->repository->getSurveyWithQuestionsAndOptions($surveyId);

        if (!$survey) return null;

        return [
            'id' => $survey->id,
            'title' => $survey->title,
            'description' => $survey->description,
            'status' => $survey->status,
            'object' => $survey->object,
            'time_limit' => $survey->time_limit,
            'total_points' => $survey->questions->sum('points'),
            'is_accessible_directly' => true,
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
        $answersInput = $this->validateAndNormalizeSubmissionPayload($surveyId, $answersInput);

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

    private function processQuestionAnswer($question, $answers): array
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

    protected function validateAndNormalizeSubmissionPayload(int $surveyId, array $answersInput): array
    {
        $normalized = array_map(function ($answer) {
            if (isset($answer['answer_text'])) {
                $answer['answer_text'] = trim((string) $answer['answer_text']);
                if ($answer['answer_text'] === '') {
                    $answer['answer_text'] = null;
                }
            }

            if (array_key_exists('selected_option_id', $answer) && $answer['selected_option_id'] !== null && $answer['selected_option_id'] !== '') {
                $answer['selected_option_id'] = (int) $answer['selected_option_id'];
            }

            return $answer;
        }, $answersInput);

        $validator = Validator::make(
            [
                'survey_id' => $surveyId,
                'answers' => $normalized,
            ],
            [
                'survey_id' => 'required|integer|min:1',
                'answers' => 'required|array|min:1',
                'answers.*.question_id' => 'required|integer|min:1',
                'answers.*.selected_option_id' => 'nullable|integer|min:1',
                'answers.*.answer_text' => 'nullable|string|max:2000',
            ],
            [],
            [
                'answers.*.question_id' => 'question_id',
                'answers.*.selected_option_id' => 'selected_option_id',
                'answers.*.answer_text' => 'answer_text',
            ]
        );

        $validator->after(function ($validator) use ($normalized) {
            foreach ($normalized as $index => $answer) {
                $hasOption = array_key_exists('selected_option_id', $answer) && $answer['selected_option_id'];
                $hasText = isset($answer['answer_text']) && $answer['answer_text'] !== null;

                if (!$hasOption && !$hasText) {
                    $validator->errors()->add("answers.$index", 'Each answer must include either selected_option_id or answer_text.');
                }
            }
        });

        if ($validator->fails()) {
            throw new ValidationException($validator);
        }

        return $normalized;
    }
}
