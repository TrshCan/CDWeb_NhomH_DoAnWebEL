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
     * @param  mixed  $_
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

    /**
     * @param  mixed  $_
     * @param  array<string, mixed>  $args
     */
    public function surveyRawData($_, array $args)
    {
        $surveyId = (int) ($args['surveyId'] ?? 0);
        if ($surveyId <= 0) {
            return [
                'title' => 'Khảo sát',
                'responses' => [],
            ];
        }
        return $this->service->getRawData($surveyId);
    }

    /**
     * @param  null  $_
     * @param  array<string, mixed>  $args
     */
    public function surveyOverview($_, array $args)
    {
        $surveyId = (int) ($args['surveyId'] ?? 0);
        if ($surveyId <= 0) {
            return [
                'title' => 'Khảo sát',
                'totalResponses' => 0,
                'questions' => [],
            ];
        }
        return $this->service->getSurveyOverview($surveyId);
    }

    /**
     * @param  mixed  $_
     * @param  array<string, mixed>  $args
     */
    public function surveyResponseDetail($_, array $args)
    {
        $surveyId = (int) ($args['surveyId'] ?? 0);
        $responseId = (string) ($args['responseId'] ?? '');

        if ($surveyId <= 0 || $responseId === '') {
            return null;
        }

        return $this->service->getResponseDetail($surveyId, $responseId);
    }

    public function surveysCompleted($_, array $args)
    {
        $userId = (int) ($args['userId'] ?? 0);
        if ($userId <= 0) return [];
        return $this->service->listCompletedByUser($userId);
    }
}


