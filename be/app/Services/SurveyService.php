<?php

namespace App\Services;

use App\Repositories\SurveyRepository;
use Illuminate\Support\Facades\Log;

class SurveyService
{
    protected $surveyRepository;

    public function __construct(SurveyRepository $surveyRepository)
    {
        $this->surveyRepository = $surveyRepository;
    }

    /**
     * Lấy tất cả surveys
     */
    public function getAllSurveys(array $filters = [])
    {
        try {
            return $this->surveyRepository->getAll($filters);
        } catch (\Exception $e) {
            Log::error('Error getting surveys: ' . $e->getMessage());
            throw new \Exception('Không thể lấy danh sách surveys: ' . $e->getMessage());
        }
    }

    /**
     * Lấy survey theo ID
     */
    public function getSurveyById($id)
    {
        try {
            return $this->surveyRepository->findById($id);
        } catch (\Exception $e) {
            Log::error('Error getting survey: ' . $e->getMessage());
            throw new \Exception('Không thể lấy thông tin survey: ' . $e->getMessage());
        }
    }

    /**
     * Tạo survey mới
     */
    public function createSurvey(array $input)
    {
        try {
            $survey = $this->surveyRepository->create($input);
            return $survey->load(['category', 'creator', 'questions', 'questionGroups']);
        } catch (\Exception $e) {
            Log::error('Error creating survey: ' . $e->getMessage());
            throw new \Exception('Không thể tạo survey: ' . $e->getMessage());
        }
    }

    /**
     * Cập nhật survey
     */
    public function updateSurvey($id, array $input)
    {
        try {
            return $this->surveyRepository->update($id, $input);
        } catch (\Exception $e) {
            Log::error('Error updating survey: ' . $e->getMessage());
            throw new \Exception('Không thể cập nhật survey: ' . $e->getMessage());
        }
    }

    /**
     * Lấy survey cho participant
     */
    public function getSurveyForParticipant($id)
    {
        try {
            return $this->surveyRepository->findForParticipant($id);
        } catch (\Exception $e) {
            Log::error('Error getting survey for participant: ' . $e->getMessage());
            throw new \Exception('Survey không tồn tại hoặc chưa được kích hoạt');
        }
    }
}
