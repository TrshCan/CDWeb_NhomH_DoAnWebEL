<?php

namespace App\Services;

use App\Repositories\QuestionRepository;
use App\Models\Survey;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class QuestionService
{
    protected $questionRepository;

    public function __construct(QuestionRepository $questionRepository)
    {
        $this->questionRepository = $questionRepository;
    }

    /**
     * Lấy câu hỏi theo ID
     */
    public function getQuestionById($id)
    {
        return $this->questionRepository->findById($id);
    }

    /**
     * Tạo câu hỏi mới
     */
    public function createQuestion(array $input)
    {
        try {
            DB::beginTransaction();

            // Tạo question code tự động
            if (!isset($input['question_code'])) {
                $survey = Survey::findOrFail($input['survey_id']);
                $questionCount = $this->questionRepository->countBySurveyId($input['survey_id']);
                $input['question_code'] = 'Q' . str_pad($questionCount + 1, 3, '0', STR_PAD_LEFT);
            }

            $question = $this->questionRepository->create($input);

            DB::commit();
            return $question->load(['survey', 'options', 'group']);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error creating question: ' . $e->getMessage());
            throw new \Exception('Không thể tạo câu hỏi: ' . $e->getMessage());
        }
    }

    /**
     * Cập nhật câu hỏi
     */
    public function updateQuestion($id, array $input)
    {
        try {
            return $this->questionRepository->update($id, $input);
        } catch (\Exception $e) {
            Log::error('Error updating question: ' . $e->getMessage());
            throw new \Exception('Không thể cập nhật câu hỏi: ' . $e->getMessage());
        }
    }

    /**
     * Xóa câu hỏi
     */
    public function deleteQuestion($id)
    {
        try {
            $this->questionRepository->delete($id);
            return true;
        } catch (\Exception $e) {
            Log::error('Error deleting question: ' . $e->getMessage());
            throw new \Exception('Không thể xóa câu hỏi: ' . $e->getMessage());
        }
    }

    /**
     * Xóa nhiều câu hỏi
     */
    public function deleteQuestionsBatch(array $ids)
    {
        try {
            $this->questionRepository->deleteBatch($ids);
            return true;
        } catch (\Exception $e) {
            Log::error('Error deleting questions batch: ' . $e->getMessage());
            throw new \Exception('Không thể xóa các câu hỏi: ' . $e->getMessage());
        }
    }

    /**
     * Sao chép câu hỏi
     */
    public function duplicateQuestion($id)
    {
        try {
            DB::beginTransaction();

            // Lấy câu hỏi gốc với options
            $originalQuestion = $this->questionRepository->findWithOptions($id);

            // Tạo bản sao câu hỏi
            $newQuestion = $this->questionRepository->replicate($originalQuestion);
            $newQuestion->survey_id = $originalQuestion->survey_id;
            $newQuestion->group_id = $originalQuestion->group_id;

            // Tạo question code mới
            $survey = Survey::findOrFail($originalQuestion->survey_id);
            $questionCount = $this->questionRepository->countBySurveyId($originalQuestion->survey_id);
            $newQuestion->question_code = 'Q' . str_pad($questionCount + 1, 3, '0', STR_PAD_LEFT);

            $newQuestion->save();

            // Sao chép options
            foreach ($originalQuestion->options as $originalOption) {
                $newOption = $originalOption->replicate();
                $newOption->question_id = $newQuestion->id;
                $newOption->option_text = $newOption->option_text ?? '';
                $newOption->save();
            }

            DB::commit();
            return $newQuestion->load(['survey', 'options', 'group']);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error duplicating question: ' . $e->getMessage());
            throw new \Exception('Không thể sao chép câu hỏi: ' . $e->getMessage());
        }
    }
}
