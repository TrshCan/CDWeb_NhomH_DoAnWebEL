<?php

namespace App\GraphQL\Resolvers;

use App\Services\SurveyJoinService;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class SurveyJoinResolver
{
    protected $service;

    public function __construct(SurveyJoinService $service)
    {
        $this->service = $service;
    }

    public function surveyJoinDetail($rootValue, array $args)
    {
        $surveyId = $args['surveyId'];
        return $this->service->getSurveyDetail($surveyId);
    }

    public function submitSurveyAnswers($rootValue, array $args)
    {
        $surveyId = (int) ($args['surveyId'] ?? 0);
        $answersInput = $args['answers'] ?? [];
        $token = request()->bearerToken();

        if (!$token) {
            return $this->buildErrorResponse('User not authenticated');
        }

        $user = User::where('remember_token', $token)->first();
        if (!$user) {
            return $this->buildErrorResponse('Invalid or expired token');
        }

        try {
            $result = $this->service->submitAnswers($surveyId, $answersInput, $user);
            return array_merge([
                'success' => true,
                'message' => 'Survey submitted successfully'
            ], $result);
        } catch (\Exception $e) {
            return $this->buildErrorResponse($e->getMessage());
        }
    }

    private function buildErrorResponse(string $message): array
    {
        return [
            'success' => false,
            'message' => $message,
            'total_score' => null,
            'max_score' => null,
            'score_percentage' => null,
        ];
    }
}
