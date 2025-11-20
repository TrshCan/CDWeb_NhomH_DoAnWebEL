<?php

namespace App\Repositories;

use App\Models\Survey;

class SurveyRepository
{
    /**
     * Lấy tất cả surveys với filters
     */
    public function getAll(array $filters = [])
    {
        $query = Survey::with(['category', 'creator', 'questions', 'questionGroups']);
        
        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }
        
        if (isset($filters['object'])) {
            $query->where('object', $filters['object']);
        }
        
        return $query->orderBy('created_at', 'desc')->get();
    }

    /**
     * Tìm survey theo ID
     */
    public function findById($id)
    {
        return Survey::with([
            'category', 
            'creator', 
            'questions.options', 
            'questionGroups.questions.options'
        ])->findOrFail($id);
    }

    /**
     * Tạo survey mới
     */
    public function create(array $data)
    {
        return Survey::create($data);
    }

    /**
     * Cập nhật survey
     */
    public function update($id, array $data)
    {
        $survey = Survey::findOrFail($id);
        $survey->update($data);
        return $survey->fresh(['category', 'creator', 'questions.options', 'questionGroups']);
    }

    /**
     * Xóa survey
     */
    public function delete($id)
    {
        $survey = Survey::findOrFail($id);
        return $survey->delete();
    }

    /**
     * Lấy survey cho participant (chỉ active surveys)
     */
    public function findForParticipant($id)
    {
        return Survey::with(['questions.options', 'questionGroups'])
            ->where('id', $id)
            ->where('status', 'active')
            ->firstOrFail();
    }
}
