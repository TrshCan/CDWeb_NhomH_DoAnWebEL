<?php

namespace App\Repositories;

use App\Models\SurveyQuestion;
use Illuminate\Support\Facades\DB;

class QuestionRepository
{
    /**
     * Tìm câu hỏi theo ID
     */
    public function findById($id)
    {
        return SurveyQuestion::with(['survey', 'options', 'group'])->findOrFail($id);
    }

    /**
     * Tạo câu hỏi mới
     */
    public function create(array $data)
    {
        return SurveyQuestion::create($data);
    }

    /**
     * Cập nhật câu hỏi
     */
    public function update($id, array $data)
    {
        $question = SurveyQuestion::findOrFail($id);
        $question->update($data);
        return $question->fresh(['survey', 'options', 'group']);
    }

    /**
     * Xóa câu hỏi
     */
    public function delete($id)
    {
        $question = SurveyQuestion::findOrFail($id);
        return $question->delete();
    }

    /**
     * Xóa nhiều câu hỏi
     */
    public function deleteBatch(array $ids)
    {
        return SurveyQuestion::whereIn('id', $ids)->delete();
    }

    /**
     * Đếm số câu hỏi trong survey
     */
    public function countBySurveyId($surveyId)
    {
        return SurveyQuestion::where('survey_id', $surveyId)->count();
    }

    /**
     * Tìm câu hỏi với options
     */
    public function findWithOptions($id)
    {
        return SurveyQuestion::with('options')->findOrFail($id);
    }

    /**
     * Sao chép câu hỏi
     */
    public function replicate($question)
    {
        return $question->replicate();
    }
}
