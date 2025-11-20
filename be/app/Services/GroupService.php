<?php

namespace App\Services;

use App\Repositories\GroupRepository;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class GroupService
{
    protected $groupRepository;

    public function __construct(GroupRepository $groupRepository)
    {
        $this->groupRepository = $groupRepository;
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
            return $this->groupRepository->update($id, $input);
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

            // Xóa tất cả câu hỏi trong group
            foreach ($group->questions as $question) {
                $question->delete();
            }

            // Xóa group
            $this->groupRepository->delete($id);

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

            // Sao chép tất cả questions và options
            foreach ($originalGroup->questions as $originalQuestion) {
                $newQuestion = $originalQuestion->replicate();
                $newQuestion->group_id = $newGroup->id;
                $newQuestion->save();

                // Sao chép options
                foreach ($originalQuestion->options as $originalOption) {
                    $newOption = $originalOption->replicate();
                    $newOption->question_id = $newQuestion->id;
                    $newOption->option_text = $newOption->option_text ?? '';
                    $newOption->save();
                }
            }

            DB::commit();
            return $newGroup->load(['survey', 'questions.options']);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error duplicating group: ' . $e->getMessage());
            throw new \Exception('Không thể sao chép group: ' . $e->getMessage());
        }
    }
}
