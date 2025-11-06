<?php

namespace App\Services;

use App\Repositories\SurveyRepository;

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
            if (!empty($row->end_at)) {
                $status = $now->greaterThan($row->end_at) ? 'closed' : 'open';
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

    public function listCompletedByUser(int $userId)
    {
        $items = $this->repo->getCompletedByUser($userId);
        return $items->map(function ($row) {
            $canView = ($row->object ?? 'public') === 'public';
            return [
                'id' => $row->id,
                'name' => $row->name,
                'creator' => $row->creator,
                'completedAt' => $row->completedAt,
                'canView' => (bool) $canView,
            ];
        });
    }
}


