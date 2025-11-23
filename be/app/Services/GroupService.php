<?php

namespace App\Services;

use App\Repositories\GroupRepository;
use App\Services\AuditLogService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class GroupService
{
    protected $groupRepository;
    protected $auditLogService;

    public function __construct(
        GroupRepository $groupRepository,
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
            
            // Sao chép tất cả questions và options
            foreach ($originalGroup->questions as $index => $originalQuestion) {
                $newQuestion = $originalQuestion->replicate();
                $newQuestion->group_id = $newGroup->id;
                
                // Tạo question_code mới theo format Q001, Q002, ...
                $newQuestion->question_code = 'Q' . str_pad($nextNumber, 3, '0', STR_PAD_LEFT);
                $nextNumber++; // Tăng cho câu hỏi tiếp theo
                
                $newQuestion->save();

                // Sao chép options
                foreach ($originalQuestion->options as $originalOption) {
                    $newOption = $originalOption->replicate();
                    $newOption->question_id = $newQuestion->id;
                    $newOption->option_text = $newOption->option_text ?? '';
                    $newOption->save();
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
}
