<?php

namespace App\Services;

use App\Repositories\OptionRepository;
use App\Services\AuditLogService;
use Illuminate\Support\Facades\Log;

class OptionService
{
    protected $optionRepository;
    protected $auditLogService;

    public function __construct(
        OptionRepository $optionRepository,
        AuditLogService $auditLogService
    ) {
        $this->optionRepository = $optionRepository;
        $this->auditLogService = $auditLogService;
    }

    /**
     * Tạo option mới
     */
    public function createOption(array $input)
    {
        try {
            // Đảm bảo option_text luôn có giá trị (ít nhất là chuỗi rỗng)
            if (!isset($input['option_text']) || $input['option_text'] === null) {
                $input['option_text'] = '';
            }
            
            $option = $this->optionRepository->create($input);
            $option->load('question');
            
            // Ghi audit log
            $question = $option->question;
            $optionText = $option->option_text ?: '(trống)';
            $this->auditLogService->log(
                $question->survey_id,
                'create',
                'option',
                $option->id,
                "Tạo lựa chọn: {$optionText}"
            );
            
            return $option;
        } catch (\Exception $e) {
            Log::error('Error creating option: ' . $e->getMessage());
            throw new \Exception('Không thể tạo option: ' . $e->getMessage());
        }
    }

    /**
     * Cập nhật option
     */
    public function updateOption($id, array $input)
    {
        try {
            // Lấy thông tin option trước khi cập nhật
            $oldOption = $this->optionRepository->findById($id);
            
            // Cập nhật option
            $option = $this->optionRepository->update($id, $input);
            
            // Tạo log chi tiết về những gì đã thay đổi
            $changes = [];
            
            // Kiểm tra các field quan trọng
            $fieldLabels = [
                'option_text' => 'Nội dung',
                'is_subquestion' => 'Câu hỏi phụ',
                'is_correct' => 'Đáp án đúng',
                'position' => 'Vị trí',
            ];
            
            foreach ($fieldLabels as $field => $label) {
                if (isset($input[$field]) && $oldOption->$field != $input[$field]) {
                    $oldValue = $oldOption->$field;
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
            $question = $option->question;
            $optionText = $option->option_text ?: '(trống)';
            $logMessage = "Cập nhật lựa chọn: {$optionText}";
            if (!empty($changes)) {
                $logMessage .= " | Thay đổi: " . implode(', ', $changes);
            }
            
            // Ghi audit log
            $this->auditLogService->log(
                $question->survey_id,
                'update',
                'option',
                $id,
                $logMessage
            );
            
            return $option;
        } catch (\Exception $e) {
            Log::error('Error updating option: ' . $e->getMessage());
            throw new \Exception('Không thể cập nhật option: ' . $e->getMessage());
        }
    }

    /**
     * Xóa option
     */
    public function deleteOption($id)
    {
        try {
            // Lấy thông tin option trước khi xóa
            $option = $this->optionRepository->findById($id);
            $question = $option->question;
            $surveyId = $question->survey_id;
            $optionText = $option->option_text;
            
            // Xóa các answers liên quan trước
            $this->optionRepository->clearRelatedAnswers($id);
            
            // Xóa option
            $this->optionRepository->delete($id);
            
            // Ghi audit log
            $optionTextDisplay = $optionText ?: '(trống)';
            $this->auditLogService->log(
                $surveyId,
                'delete',
                'option',
                $id,
                "Xóa lựa chọn: {$optionTextDisplay}"
            );
            
            return true;
        } catch (\Exception $e) {
            Log::error('Error deleting option: ' . $e->getMessage());
            throw new \Exception('Không thể xóa option: ' . $e->getMessage());
        }
    }
}
