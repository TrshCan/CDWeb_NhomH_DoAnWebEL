<?php

namespace App\Services;

use App\Repositories\SurveyRepository;
use App\Services\AuditLogService;
use Illuminate\Support\Facades\Log;

class SurveyService
{
    protected $surveyRepository;
    protected $auditLogService;

    public function __construct(
        SurveyRepository $surveyRepository,
        AuditLogService $auditLogService
    ) {
        $this->surveyRepository = $surveyRepository;
        $this->auditLogService = $auditLogService;
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
            // Lấy thông tin survey trước khi cập nhật
            $oldSurvey = $this->surveyRepository->findById($id);
            
            // Cập nhật survey
            $survey = $this->surveyRepository->update($id, $input);
            
            // Tạo log chi tiết về những gì đã thay đổi
            $changes = [];
            
            // Kiểm tra các field quan trọng
            $fieldLabels = [
                'title' => 'Tiêu đề',
                'description' => 'Mô tả',
                'type' => 'Loại',
                'object' => 'Đối tượng',
                'status' => 'Trạng thái',
                'start_at' => 'Thời gian bắt đầu',
                'end_at' => 'Thời gian kết thúc',
                'time_limit' => 'Giới hạn thời gian',
                'points' => 'Điểm',
                'allow_review' => 'Cho phép xem lại',
            ];
            
            foreach ($fieldLabels as $field => $label) {
                if (isset($input[$field]) && $oldSurvey->$field != $input[$field]) {
                    $oldValue = $oldSurvey->$field;
                    $newValue = $input[$field];
                    
                    // Format giá trị boolean
                    if (is_bool($oldValue) || is_bool($newValue)) {
                        $oldValue = $oldValue ? 'Có' : 'Không';
                        $newValue = $newValue ? 'Có' : 'Không';
                    }
                    
                    // Format giá trị rỗng
                    $oldValue = $oldValue ?: '(trống)';
                    $newValue = $newValue ?: '(trống)';
                    
                    $changes[] = "{$label}: \"{$oldValue}\" → \"{$newValue}\"";
                }
            }
            
            // Tạo message log
            $logMessage = "Cập nhật cài đặt survey: {$survey->title}";
            if (!empty($changes)) {
                $logMessage .= " | Thay đổi: " . implode(', ', $changes);
            }
            
            // Ghi audit log
            $this->auditLogService->log(
                $id,
                'update',
                'survey',
                $id,
                $logMessage
            );
            
            return $survey;
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
