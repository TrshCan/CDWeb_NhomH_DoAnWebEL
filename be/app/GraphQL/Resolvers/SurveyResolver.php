<?php

namespace App\GraphQL\Resolvers;

use App\Services\SurveyService;

class SurveyResolver
{
    protected $surveyService;
    
    public function __construct(SurveyService $surveyService)
    {
        $this->surveyService = $surveyService;
    }
    
    /**
     * Lấy danh sách surveys
     */
    public function list($rootValue, array $args)
    {
        $filters = [];
        
        if (isset($args['status'])) {
            $filters['status'] = $args['status'];
        }
        
        if (isset($args['object'])) {
            $filters['object'] = $args['object'];
        }
        
        return $this->surveyService->getAllSurveys($filters);
    }
    
    /**
     * Lấy chi tiết survey
     */
    public function find($rootValue, array $args)
    {
        return $this->surveyService->getSurveyById($args['id']);
    }
    
    /**
     * Tạo survey mới
     */
    public function create($rootValue, array $args)
    {
        return $this->surveyService->createSurvey($args['input']);
    }
    
    /**
     * Cập nhật survey (partial update)
     */
    public function update($rootValue, array $args)
    {
        return $this->surveyService->updateSurvey($args['id'], $args['input']);
    }
    
    /**
     * Lấy survey cho người tham gia (public access)
     */
    public function forParticipant($rootValue, array $args)
    {
        return $this->surveyService->getSurveyForParticipant($args['id']);
    }
}
