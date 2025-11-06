<?php

namespace App\GraphQL\Resolvers;

use App\Services\SurveyService;

class SurveyResolver
{
    protected SurveyService $service;

    public function __construct(SurveyService $service)
    {
        $this->service = $service;
    }

    public function surveysMade($_, array $args)
    {
        $createdBy = (int) ($args['createdBy'] ?? 0);
        if ($createdBy <= 0) return [];
        return $this->service->listByCreatorWithStatus($createdBy);
    }

    public function surveysCompleted($_, array $args)
    {
        $userId = (int) ($args['userId'] ?? 0);
        if ($userId <= 0) return [];
        return $this->service->listCompletedByUser($userId);
    }
}


