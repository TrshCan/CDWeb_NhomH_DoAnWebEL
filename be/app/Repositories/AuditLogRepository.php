<?php

namespace App\Repositories;

use App\Models\AuditLog;

class AuditLogRepository
{
    public function getLogsBySurveyId($surveyId, $limit = 100)
    {
        return AuditLog::where('survey_id', $surveyId)
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
    }

    public function create(array $data)
    {
        return AuditLog::create($data);
    }
}
