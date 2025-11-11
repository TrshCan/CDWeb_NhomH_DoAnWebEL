<?php

namespace App\Services;

use App\Repositories\SurveyRepository;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

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

    public function getSurveyOverview(int $surveyId): array
    {
        $surveyTitle = $this->repo->getSurveyTitle($surveyId);
        $questionsData = $this->repo->getSurveyOverviewData($surveyId);
        
        // Get total unique responses (count distinct users who answered)
        $totalResponses = DB::table('survey_answers')
            ->join('survey_questions', 'survey_questions.id', '=', 'survey_answers.question_id')
            ->where('survey_questions.survey_id', $surveyId)
            ->whereNull('survey_answers.deleted_at')
            ->select(DB::raw('COUNT(DISTINCT survey_answers.user_id) as total'))
            ->value('total') ?? 0;

        return [
            'title' => $surveyTitle ?? 'Khảo sát',
            'totalResponses' => $totalResponses,
            'questions' => $questionsData,
        ];
    }
}


