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
}


