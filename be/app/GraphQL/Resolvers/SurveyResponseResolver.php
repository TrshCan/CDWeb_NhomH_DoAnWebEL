<?php

namespace App\GraphQL\Resolvers;

use App\Services\SurveyResponseService;
use Illuminate\Support\Facades\Auth;

class SurveyResponseResolver
{
    protected $responseService;

    public function __construct(SurveyResponseService $responseService)
    {
        $this->responseService = $responseService;
    }

    /**
     * Submit câu trả lời survey
     */
    public function submitResponse($rootValue, array $args)
    {
        $surveyId = $args['survey_id'];
        $userId = $args['user_id'] ?? Auth::id();
        $answers = $args['answers'];

        return $this->responseService->submitSurveyResponse($surveyId, $userId, $answers);
    }

    /**
     * Lấy kết quả của người dùng
     */
    public function getUserResult($rootValue, array $args)
    {
        $surveyId = $args['survey_id'];
        $userId = $args['user_id'] ?? Auth::id();

        return $this->responseService->getUserResult($surveyId, $userId);
    }
}
