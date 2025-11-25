<?php

namespace App\Services;

use App\Repositories\GroupQuestionRepository;
use App\Services\AuditLogService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class GroupQuestionService
{
    protected $groupRepository;
    protected $auditLogService;

    public function __construct(
        GroupQuestionRepository $groupRepository,
        AuditLogService $auditLogService
    ) {
        $this->groupRepository = $groupRepository;
        $this->auditLogService = $auditLogService;
    }

    /**
     * Lấy group theo ID
     */
    public function getGroupById($id)
    {
        return $this->groupRepository->findById($id);
    }

    /**
     * Tạo group mới
     */
    public function createGroup(array $input)
    {
        try {
            DB::beginTransaction();

            // Tự động set position nếu không có
            if (!isset($input['position'])) {
                $groupCount = $this->groupRepository->countBySurveyId($input['survey_id']);
                $input['position'] = $groupCount + 1;
            }

            $group = $this->groupRepository->create($input);

            // Ghi audit log
            $this->auditLogService->log(
                $input['survey_id'],
                'create',
                'group',
                $group->id,
                "Tạo nhóm câu hỏi: {$group->title}"
            );

            DB::commit();
            return $group->load(['survey', 'questions.options']);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error creating group: ' . $e->getMessage());
            throw new \Exception('Không thể tạo group: ' . $e->getMessage());
        }
    }

    /**
     * Cập nhật group
     */
    public function updateGroup($id, array $input)
    {
        try {
            // Lấy thông tin group trước khi cập nhật
            $oldGroup = $this->groupRepository->findById($id);
            
            // Cập nhật group
            $group = $this->groupRepository->update($id, $input);
            
            // Tạo log chi tiết về những gì đã thay đổi
            $changes = [];
            
            // Kiểm tra các field quan trọng
            $fieldLabels = [
                'title' => 'Tiêu đề',
                'position' => 'Vị trí',
            ];
            
            foreach ($fieldLabels as $field => $label) {
                if (isset($input[$field]) && $oldGroup->$field != $input[$field]) {
                    $oldValue = $oldGroup->$field ?: '(trống)';
                    $newValue = $input[$field] ?: '(trống)';
                    $changes[] = "{$label}: \"{$oldValue}\" → \"{$newValue}\"";
                }
            }
            
            // Tạo message log
            $logMessage = "Cập nhật nhóm câu hỏi: {$group->title}";
            if (!empty($changes)) {
                $logMessage .= " | Thay đổi: " . implode(', ', $changes);
            }
            
            // Ghi audit log
            $this->auditLogService->log(
                $group->survey_id,
                'update',
                'group',
                $id,
                $logMessage
            );
            
            return $group;
        } catch (\Exception $e) {
            Log::error('Error updating group: ' . $e->getMessage());
            throw new \Exception('Không thể cập nhật group: ' . $e->getMessage());
        }
    }

    /**
     * Xóa group và tất cả câu hỏi trong group
     */
    public function deleteGroup($id)
    {
        try {
            DB::beginTransaction();

            // Lấy group với questions
            $group = $this->groupRepository->findWithQuestions($id);
            $surveyId = $group->survey_id;
            $groupTitle = $group->title;

            // Xóa tất cả câu hỏi trong group
            foreach ($group->questions as $question) {
                $question->delete();
            }

            // Xóa group
            $this->groupRepository->delete($id);
            
            // Ghi audit log
            $this->auditLogService->log(
                $surveyId,
                'delete',
                'group',
                $id,
                "Xóa nhóm câu hỏi: {$groupTitle}"
            );

            DB::commit();
            return true;
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error deleting group: ' . $e->getMessage());
            throw new \Exception('Không thể xóa group: ' . $e->getMessage());
        }
    }

    /**
     * Sao chép group
     */
    public function duplicateGroup($id)
    {
        try {
            DB::beginTransaction();

            // Lấy group gốc với questions
            $originalGroup = $this->groupRepository->findWithQuestions($id);

            // Tạo bản sao group
            $newGroup = $this->groupRepository->replicate($originalGroup);
            $newGroup->survey_id = $originalGroup->survey_id;
            $newGroup->title = $originalGroup->title;

            // Tạo position mới
            $groupCount = $this->groupRepository->countBySurveyId($originalGroup->survey_id);
            $newGroup->position = $groupCount + 1;

            $newGroup->save();

            // Tìm question_code lớn nhất hiện có để tạo code mới
            $maxCode = \App\Models\SurveyQuestion::where('survey_id', $originalGroup->survey_id)
                ->whereNotNull('question_code')
                ->where('question_code', 'LIKE', 'Q%')
                ->orderByRaw('CAST(SUBSTRING(question_code, 2) AS UNSIGNED) DESC')
                ->value('question_code');
            
            $nextNumber = 1;
            if ($maxCode) {
                $currentNumber = (int) substr($maxCode, 1);
                $nextNumber = $currentNumber + 1;
            }
            
            // Map để lưu ID cũ -> ID mới (cho cả question và option)
            $questionIdMap = [];
            $optionIdMap = [];
            
            // Sao chép tất cả questions và options
            foreach ($originalGroup->questions as $index => $originalQuestion) {
                $newQuestion = $originalQuestion->replicate();
                $newQuestion->group_id = $newGroup->id;
                
                // Tạo question_code mới theo format Q001, Q002, ...
                $newQuestion->question_code = 'Q' . str_pad($nextNumber, 3, '0', STR_PAD_LEFT);
                $nextNumber++; // Tăng cho câu hỏi tiếp theo
                
                // Tạm thời xóa conditions, sẽ cập nhật sau
                $newQuestion->conditions = null;
                
                $newQuestion->save();
                
                // Lưu mapping ID cũ -> mới
                $questionIdMap[$originalQuestion->id] = $newQuestion->id;

                // Sao chép options
                foreach ($originalQuestion->options as $originalOption) {
                    $newOption = $originalOption->replicate();
                    $newOption->question_id = $newQuestion->id;
                    $newOption->option_text = $newOption->option_text ?? '';
                    $newOption->save();
                    
                    // Lưu mapping option ID cũ -> mới
                    $optionIdMap[$originalOption->id] = $newOption->id;
                }
            }
            
            // Cập nhật conditions với ID mới
            foreach ($originalGroup->questions as $originalQuestion) {
                if (!empty($originalQuestion->conditions)) {
                    $newQuestionId = $questionIdMap[$originalQuestion->id];
                    $newConditions = $this->remapConditions(
                        $originalQuestion->conditions, 
                        $questionIdMap, 
                        $optionIdMap
                    );
                    
                    // Cập nhật conditions cho question mới
                    \App\Models\SurveyQuestion::where('id', $newQuestionId)
                        ->update(['conditions' => $newConditions]);
                }
            }

            // Ghi audit log
            $this->auditLogService->log(
                $originalGroup->survey_id,
                'duplicate',
                'group',
                $newGroup->id,
                "Sao chép nhóm câu hỏi: {$newGroup->title}"
            );

            DB::commit();
            return $newGroup->load(['survey', 'questions.options']);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error duplicating group: ' . $e->getMessage());
            throw new \Exception('Không thể sao chép group: ' . $e->getMessage());
        }
    }
    
    /**
     * Remap conditions với ID mới sau khi duplicate
     * Format conditions: [{ field: 'question_id', value: 'option_id', operator: 'equals' }]
     */
    private function remapConditions($conditions, $questionIdMap, $optionIdMap)
    {
        if (empty($conditions)) {
            return [];
        }
        
        // Nếu conditions là string JSON, decode nó
        if (is_string($conditions)) {
            $conditions = json_decode($conditions, true);
        }
        
        if (!is_array($conditions)) {
            return [];
        }
        
        $newConditions = [];
        
        foreach ($conditions as $condition) {
            $newCondition = $condition;
            
            // Remap field (question_id)
            if (isset($condition['field'])) {
                $oldQuestionId = $condition['field'];
                if (isset($questionIdMap[$oldQuestionId])) {
                    $newCondition['field'] = (string) $questionIdMap[$oldQuestionId];
                }
            }
            
            // Remap value (option_id) - có thể là single value hoặc array
            if (isset($condition['value'])) {
                $oldValue = $condition['value'];
                if (is_array($oldValue)) {
                    $newCondition['value'] = array_map(function($optId) use ($optionIdMap) {
                        return isset($optionIdMap[$optId]) ? (string) $optionIdMap[$optId] : $optId;
                    }, $oldValue);
                } else {
                    if (isset($optionIdMap[$oldValue])) {
                        $newCondition['value'] = (string) $optionIdMap[$oldValue];
                    }
                }
            }
            
            $newConditions[] = $newCondition;
        }
        
        return $newConditions;
    }
}
