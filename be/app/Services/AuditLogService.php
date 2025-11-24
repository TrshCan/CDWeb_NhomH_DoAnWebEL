<?php

namespace App\Services;

use App\Repositories\AuditLogRepository;

class AuditLogService
{
    protected $auditLogRepository;

    public function __construct(AuditLogRepository $auditLogRepository)
    {
        $this->auditLogRepository = $auditLogRepository;
    }

    public function getLogsBySurveyId($surveyId)
    {
        return $this->auditLogRepository->getLogsBySurveyId($surveyId);
    }

    public function log($surveyId, $action, $entityType, $entityId = null, $details = null)
    {
        try {
            return $this->auditLogRepository->create([
                'survey_id' => $surveyId,
                'user_id' => auth()->id(),
                'user_name' => auth()->user()->name ?? 'Guest',
                'action' => $action,
                'entity_type' => $entityType,
                'entity_id' => $entityId,
                'details' => is_array($details) ? json_encode($details) : $details,
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
                'created_at' => now(),
            ]);
        } catch (\Exception $e) {
            \Log::error('Failed to create audit log: ' . $e->getMessage());
            return null;
        }
    }
}
