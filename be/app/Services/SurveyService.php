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

    public function getRawData(int $surveyId)
    {
        $rawData = $this->repo->getRawDataBySurveyId($surveyId);
        $surveyTitle = $this->repo->getSurveyTitle($surveyId);

        return [
            'title' => $surveyTitle ?? 'Khảo sát',
            'responses' => $rawData->map(function ($row) {
                // Map faculty name to khoa code for frontend compatibility
                $khoa = 'other';
                if (!empty($row->faculty_name)) {
                    $facultyName = strtolower($row->faculty_name);
                    if (strpos($facultyName, 'công nghệ') !== false || strpos($facultyName, 'cntt') !== false) {
                        $khoa = 'cntt';
                    } elseif (strpos($facultyName, 'kinh tế') !== false || strpos($facultyName, 'kinhte') !== false) {
                        $khoa = 'kinhte';
                    }
                }

                // Format completed date
                $completedDate = null;
                if ($row->completed_date) {
                    $date = Carbon::parse($row->completed_date);
                    $completedDate = $date->format('d/m/Y H:i');
                }

                return [
                    'id' => $row->response_id,
                    'studentId' => (string) $row->user_id, // Using user_id as student ID
                    'studentName' => $row->student_name ?? 'N/A',
                    'khoa' => $khoa,
                    'completedDate' => $completedDate ?? 'N/A',
                ];
            })->values()->all(), // Convert to array for GraphQL
        ];
    }
}


