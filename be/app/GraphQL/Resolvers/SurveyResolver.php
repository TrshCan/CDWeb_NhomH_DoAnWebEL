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
        // Verify authentication
        $token = request()->bearerToken();
        if (!$token) {
            throw new \Exception('Authentication required');
        }

        $user = \App\Models\User::where('remember_token', $token)->first();
        if (!$user) {
            throw new \Exception('Invalid or expired token');
        }

        $createdBy = (int) ($args['createdBy'] ?? 0);
        if ($createdBy <= 0) {
            return [];
        }

        // Verify the user is requesting their own surveys
        if ($user->id !== $createdBy) {
            throw new \Exception('Unauthorized: You can only view your own surveys');
        }

        return $this->service->listByCreatorWithStatus($createdBy);
    }

    /**
     * @param  mixed  $_
     * @param  array<string, mixed>  $args
     */
    public function surveyRawData($_, array $args)
    {
        // Verify authentication
        $token = request()->bearerToken();
        if (!$token) {
            throw new \Exception('Authentication required');
        }

        $user = \App\Models\User::where('remember_token', $token)->first();
        if (!$user) {
            throw new \Exception('Invalid or expired token');
        }

        $surveyId = (int) ($args['surveyId'] ?? 0);
        if ($surveyId <= 0) {
            return [
                'title' => 'Khảo sát',
                'responses' => [],
            ];
        }

        // Verify the user owns this survey
        $survey = \App\Models\Survey::find($surveyId);
        if (!$survey || $survey->created_by !== $user->id) {
            throw new \Exception('Unauthorized: You can only view data for your own surveys');
        }

        return $this->service->getRawData($surveyId);
    }

    /**
     * @param  null  $_
     * @param  array<string, mixed>  $args
     */
    public function surveyOverview($_, array $args)
    {
        // Verify authentication
        $token = request()->bearerToken();
        if (!$token) {
            throw new \Exception('Authentication required');
        }

        $user = \App\Models\User::where('remember_token', $token)->first();
        if (!$user) {
            throw new \Exception('Invalid or expired token');
        }

        $surveyId = (int) ($args['surveyId'] ?? 0);
        if ($surveyId <= 0) {
            return [
                'title' => 'Khảo sát',
                'totalResponses' => 0,
                'questions' => [],
            ];
        }

        // Verify the user owns this survey
        $survey = \App\Models\Survey::find($surveyId);
        if (!$survey || $survey->created_by !== $user->id) {
            throw new \Exception('Unauthorized: You can only view overview for your own surveys');
        }

        return $this->service->getSurveyOverview($surveyId);
    }

    /**
     * @param  mixed  $_
     * @param  array<string, mixed>  $args
     */
    public function surveyResponseDetail($_, array $args)
    {
        // Verify authentication
        $token = request()->bearerToken();
        if (!$token) {
            throw new \Exception('Authentication required');
        }

        $user = \App\Models\User::where('remember_token', $token)->first();
        if (!$user) {
            throw new \Exception('Invalid or expired token');
        }

        $surveyId = (int) ($args['surveyId'] ?? 0);
        $responseId = (string) ($args['responseId'] ?? '');

        if ($surveyId <= 0 || $responseId === '') {
            return null;
        }

        // Verify the user owns this survey
        $survey = \App\Models\Survey::find($surveyId);
        if (!$survey || $survey->created_by !== $user->id) {
            throw new \Exception('Unauthorized: You can only view responses for your own surveys');
        }

        return $this->service->getResponseDetail($surveyId, $responseId);
    }

    public function surveysCompleted($_, array $args)
    {
        // Verify authentication
        $token = request()->bearerToken();
        if (!$token) {
            throw new \Exception('Authentication required');
        }

        $user = \App\Models\User::where('remember_token', $token)->first();
        if (!$user) {
            throw new \Exception('Invalid or expired token');
        }

        $userId = (int) ($args['userId'] ?? 0);
        if ($userId <= 0) return [];

        // Verify the user is requesting their own completed surveys
        if ($user->id !== $userId) {
            throw new \Exception('Unauthorized: You can only view your own completed surveys');
        }

        return $this->service->listCompletedByUser($userId);
    }
}


