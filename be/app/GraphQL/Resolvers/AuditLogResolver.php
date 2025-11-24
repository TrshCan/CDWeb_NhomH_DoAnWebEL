<?php

namespace App\GraphQL\Resolvers;

use App\Services\AuditLogService;

class AuditLogResolver
{
    protected $auditLogService;
    
    public function __construct(AuditLogService $auditLogService)
    {
        $this->auditLogService = $auditLogService;
    }
    
    public function list($rootValue, array $args)
    {
        return $this->auditLogService->getLogsBySurveyId($args['survey_id']);
    }
}
