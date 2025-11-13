<?php

namespace App\Services;

use App\Repositories\SurveyRepository;
use Illuminate\Support\Carbon;

class SurveyService
{
    protected SurveyRepository $repo;

    public function __construct(SurveyRepository $repo)
    {
        $this->repo = $repo;
    }

    public function listByCreatorWithStatus(int $createdBy)
    {
        $items = $this->repo->getByCreatorWithResponseCounts($createdBy);
        $now = now();

        return $items->map(function ($row) use ($now) {
            $status = 'open';
            // Draft if start_at is null (not present in select) -> using created_at as existing data
            // We decide: if end_at is null => open; if end_at in past => closed
            if (!empty($row->end_at)) {
                $status = $now->greaterThan($row->end_at) ? 'closed' : 'open';
            } else {
                $status = 'open';
            }

            return [
                'id' => $row->id,
                'title' => $row->title,
                'created_at' => $row->created_at,
                'end_at' => $row->end_at,
                'status' => $status,
                'responses' => (int) ($row->responses ?? 0),
            ];
        });
    }

    public function getRawData(int $surveyId): array
    {
        // @var Collection $rawData
        $rawData = $this->repo->getRawDataBySurveyId($surveyId);
        $surveyTitle = $this->repo->getSurveyTitle($surveyId);

        return [
            'title' => $surveyTitle ?? 'Khảo sát',
            'responses' => $rawData->map(function ($row) {
                // Use the real faculty name; fall back to 'other' if missing
                $khoa = $row->faculty_name ?? 'other';

                // Format completed date (or 'N/A')
                $completedDate = $row->completed_date
                    ? Carbon::parse($row->completed_date)->format('d/m/Y H:i')
                    : 'N/A';

                // Use student_code if available, otherwise fall back to user_id
                $studentId = $row->student_code ?? (string) $row->user_id;

                return [
                    'id' => $row->response_id,
                    'studentId' => $studentId,
                    'studentName' => $row->student_name ?? 'N/A',
                    'khoa' => $khoa,
                    'completedDate' => $completedDate,
                ];
            })->values()->all(),
        ];
    }

    public function getResponseDetail(int $surveyId, string $responseId): ?array
    {
        $userId = $this->extractUserIdFromResponseId($responseId);
        if ($userId <= 0) {
            return null;
        }

        $survey = $this->repo->findSurveyWithQuestions($surveyId);
        if (!$survey) {
            return null;
        }

        $participant = $this->repo->getParticipantProfile($userId);
        if (!$participant) {
            return null;
        }

        $answers = $this->repo->getAnswersForSurveyAndUser($surveyId, $userId);
        $answersByQuestion = $answers->groupBy('question_id');

        $totalQuestions = $survey->questions->count();
        $answeredQuestions = $answersByQuestion->filter(function ($collection) {
            return $collection instanceof \Illuminate\Support\Collection && $collection->isNotEmpty();
        })->count();

        $maxScore = (float) $survey->questions->sum(function ($question) {
            return (float) ($question->points ?? 0);
        });

        $totalScore = (float) $answers->sum(function ($answer) {
            return (float) ($answer->score ?? 0);
        });

        $scorePercentage = $maxScore > 0
            ? round(($totalScore / $maxScore) * 100, 2)
            : null;

        $firstAnsweredAt = $answers->min('answered_at');
        $lastAnsweredAt = $answers->max('answered_at');

        $completionTime = $this->formatCompletionTime($firstAnsweredAt, $lastAnsweredAt);
        $completedAt = $this->formatCompletedAt($lastAnsweredAt);

        $questions = $survey->questions->map(function ($question) use ($answersByQuestion) {
            $questionAnswers = $answersByQuestion->get($question->id, collect());
            $questionAnswers = $questionAnswers instanceof \Illuminate\Support\Collection
                ? $questionAnswers
                : collect($questionAnswers);

            $score = $questionAnswers->sum(function ($answer) {
                return (float) ($answer->score ?? 0);
            });

            $answerText = null;
            $options = null;

            if ($question->question_type === 'text') {
                $firstAnswer = $questionAnswers->first();
                $answerText = $firstAnswer ? ($firstAnswer->answer_text ?? null) : null;
            } else {
                $selectedOptionIds = $questionAnswers
                    ->pluck('selected_option_id')
                    ->filter()
                    ->map(fn ($id) => (int) $id)
                    ->values()
                    ->all();

                $options = $question->options->map(function ($option) use ($selectedOptionIds) {
                    $optionId = (int) $option->id;
                    return [
                        'id' => (string) $optionId,
                        'text' => $option->option_text,
                        'selected' => in_array($optionId, $selectedOptionIds, true),
                        'isCorrect' => (bool) $option->is_correct,
                    ];
                })->values()->all();
            }

            return [
                'id' => (string) $question->id,
                'question' => $question->question_text,
                'type' => $question->question_type,
                'answerText' => $answerText,
                'options' => $options,
                'score' => round($score, 2),
                'points' => (float) ($question->points ?? 0),
            ];
        })->values()->all();

        $navigationIds = $this->repo->getResponseIdsForSurvey($surveyId);
        $navigation = null;
        $currentIndex = array_search($responseId, $navigationIds, true);
        if ($currentIndex !== false) {
            $navigation = [
                'previous' => $navigationIds[$currentIndex + 1] ?? null,
                'next' => $currentIndex > 0 ? ($navigationIds[$currentIndex - 1] ?? null) : null,
            ];
        }

        return [
            'responseId' => $responseId,
            'surveyId' => $surveyId,
            'surveyTitle' => $survey->title,
            'participant' => [
                'name' => $participant->name ?? 'N/A',
                'studentId' => $participant->student_code ?? null,
                'faculty' => $participant->faculty_name ?? null,
                'class' => $participant->class_name ?? null,
                'completedAt' => $completedAt,
            ],
            'stats' => [
                'completionTime' => $completionTime,
                'answeredQuestions' => $answeredQuestions,
                'totalQuestions' => $totalQuestions,
                'totalScore' => round($totalScore, 2),
                'maxScore' => round($maxScore, 2),
                'scorePercentage' => $scorePercentage,
            ],
            'questions' => $questions,
            'navigation' => $navigation,
        ];
    }

    protected function extractUserIdFromResponseId(string $responseId): int
    {
        $parts = array_filter(explode('-', $responseId), fn ($part) => $part !== '');
        if (empty($parts)) {
            return 0;
        }

        $userPart = array_pop($parts);
        return (int) $userPart;
    }

    protected function formatCompletionTime($start, $end): ?string
    {
        if (!$start || !$end) {
            return null;
        }

        $startCarbon = $start instanceof Carbon ? $start : Carbon::parse($start);
        $endCarbon = $end instanceof Carbon ? $end : Carbon::parse($end);

        if ($endCarbon->lessThanOrEqualTo($startCarbon)) {
            return '0s';
        }

        $diffInSeconds = $endCarbon->diffInSeconds($startCarbon);

        $hours = intdiv($diffInSeconds, 3600);
        $minutes = intdiv($diffInSeconds % 3600, 60);
        $seconds = $diffInSeconds % 60;

        $parts = [];
        if ($hours > 0) {
            $parts[] = $hours . 'h';
        }
        if ($minutes > 0 || $hours > 0) {
            $parts[] = $minutes . 'm';
        }
        $parts[] = $seconds . 's';

        return implode(' ', $parts);
    }

    protected function formatCompletedAt($value): ?string
    {
        if (!$value) {
            return null;
        }

        $carbon = $value instanceof Carbon ? $value : Carbon::parse($value);
        return $carbon->format('d/m/Y H:i');
    }
}


