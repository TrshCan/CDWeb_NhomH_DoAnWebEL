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

    /**
     * @param  null  $_
     * @param  array<string, mixed>  $args
     */
    public function surveysMade($_, array $args)
    {
        $createdBy = (int) ($args['createdBy'] ?? 0);
        if ($createdBy <= 0) {
            return [];
        }
        return $this->service->listByCreatorWithStatus($createdBy);
    }
}


