<?php

namespace App\Repositories;

use App\Models\QuestionGroup;

class GroupRepository
{
    /**
     * Tìm group theo ID
     */
    public function findById($id)
    {
        return QuestionGroup::with(['survey', 'questions.options'])->findOrFail($id);
    }

    /**
     * Tạo group mới
     */
    public function create(array $data)
    {
        return QuestionGroup::create($data);
    }

    /**
     * Cập nhật group
     */
    public function update($id, array $data)
    {
        $group = QuestionGroup::findOrFail($id);
        $group->update($data);
        return $group->fresh(['survey', 'questions.options']);
    }

    /**
     * Xóa group
     */
    public function delete($id)
    {
        $group = QuestionGroup::findOrFail($id);
        return $group->delete();
    }

    /**
     * Đếm số group trong survey
     */
    public function countBySurveyId($surveyId)
    {
        return QuestionGroup::where('survey_id', $surveyId)->count();
    }

    /**
     * Tìm group với questions
     */
    public function findWithQuestions($id)
    {
        return QuestionGroup::with('questions.options')->findOrFail($id);
    }

    /**
     * Sao chép group
     */
    public function replicate($group)
    {
        return $group->replicate();
    }
}
