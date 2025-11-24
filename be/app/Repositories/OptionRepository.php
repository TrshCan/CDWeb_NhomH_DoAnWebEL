<?php

namespace App\Repositories;

use App\Models\SurveyOption;
use Illuminate\Support\Facades\DB;

class OptionRepository
{
    /**
     * Tìm option theo ID
     */
    public function findById($id)
    {
        return SurveyOption::with('question')->findOrFail($id);
    }

    /**
     * Tạo option mới
     */
    public function create(array $data)
    {
        return SurveyOption::create($data);
    }

    /**
     * Cập nhật option
     */
    public function update($id, array $data)
    {
        $option = SurveyOption::findOrFail($id);
        $option->update($data);
        return $option->fresh('question');
    }

    /**
     * Xóa option
     */
    public function delete($id)
    {
        $option = SurveyOption::findOrFail($id);
        return $option->delete();
    }

    /**
     * Xóa các answers liên quan đến option
     */
    public function clearRelatedAnswers($optionId)
    {
        return DB::table('survey_answers')
            ->where('selected_option_id', $optionId)
            ->update(['selected_option_id' => null]);
    }

    /**
     * Sao chép option
     */
    public function replicate($option)
    {
        return $option->replicate();
    }
}
