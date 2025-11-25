<?php

namespace App\Services;

use App\Repositories\QuestionRepository;
use App\Models\Survey;
use App\Services\AuditLogService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class QuestionService
{
    protected $questionRepository;
    protected $auditLogService;

    public function __construct(
        QuestionRepository $questionRepository,
        AuditLogService $auditLogService
    ) {
        $this->questionRepository = $questionRepository;
        $this->auditLogService = $auditLogService;
    }

    /**
     * Tạo question_code mới cho survey
     * Tối ưu: Sử dụng raw SQL để tìm max number nhanh nhất
     */
    private function generateNextQuestionCode($surveyId)
    {
        // Sử dụng raw SQL để tìm số lớn nhất trong question_code
        // Chỉ lấy các code có format Q + số
        $maxNumber = \DB::table('survey_questions')
            ->where('survey_id', $surveyId)
            ->whereNotNull('question_code')
            ->where('question_code', 'REGEXP', '^Q[0-9]+$')
            ->selectRaw('MAX(CAST(SUBSTRING(question_code, 2) AS UNSIGNED)) as max_num')
            ->value('max_num');
        
        $nextNumber = $maxNumber ? ($maxNumber + 1) : 1;
        
        return 'Q' . str_pad($nextNumber, 3, '0', STR_PAD_LEFT);
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

            // Tạo question code tự động (LUÔN LUÔN tạo, không bao giờ để trống)
            if (!isset($input['question_code']) || $input['question_code'] === null || trim($input['question_code']) === '') {
                $input['question_code'] = $this->generateNextQuestionCode($input['survey_id']);
            } else {
                // Nếu có question_code từ input, validate nó
                $input['question_code'] = trim($input['question_code']);
                
                // Kiểm tra độ dài tối đa 100 ký tự
                if (strlen($input['question_code']) > 100) {
                    throw new \Exception('Mã câu hỏi không được vượt quá 100 ký tự. Độ dài hiện tại: ' . strlen($input['question_code']) . ' ký tự.');
                }
                
                // Kiểm tra trùng lặp trong cùng survey
                $existingQuestion = \App\Models\SurveyQuestion::where('survey_id', $input['survey_id'])
                    ->where('question_code', $input['question_code'])
                    ->first();
                
                if ($existingQuestion) {
                    throw new \Exception('Mã câu hỏi "' . $input['question_code'] . '" đã tồn tại trong khảo sát này. Vui lòng sử dụng mã khác.');
                }
            }

            $question = $this->questionRepository->create($input);

            // Ghi audit log
            $this->auditLogService->log(
                $input['survey_id'],
                'create',
                'question',
                $question->id,
                "Tạo câu hỏi: {$question->question_text}"
            );

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
            // Lấy thông tin câu hỏi trước khi cập nhật
            $oldQuestion = $this->questionRepository->findById($id);
            
            // Nếu cập nhật question_code, validate nó
            if (isset($input['question_code'])) {
                $input['question_code'] = trim($input['question_code']);
                
                // Không cho phép để trống
                if (empty($input['question_code'])) {
                    throw new \Exception('Mã câu hỏi không được để trống.');
                }
                
                // Kiểm tra độ dài tối đa 100 ký tự
                if (strlen($input['question_code']) > 100) {
                    throw new \Exception('Mã câu hỏi không được vượt quá 100 ký tự. Độ dài hiện tại: ' . strlen($input['question_code']) . ' ký tự.');
                }
                
                // Kiểm tra trùng lặp (trừ chính nó)
                $existingQuestion = \App\Models\SurveyQuestion::where('survey_id', $oldQuestion->survey_id)
                    ->where('question_code', $input['question_code'])
                    ->where('id', '!=', $id)
                    ->first();
                
                if ($existingQuestion) {
                    throw new \Exception('Mã câu hỏi "' . $input['question_code'] . '" đã tồn tại trong khảo sát này (Câu hỏi ID: ' . $existingQuestion->id . '). Vui lòng sử dụng mã khác.');
                }
            }
            
            // Cập nhật câu hỏi
            $question = $this->questionRepository->update($id, $input);
            
            // Tạo log chi tiết về những gì đã thay đổi
            $changes = [];
            
            // Kiểm tra các field quan trọng
            $fieldLabels = [
                'question_text' => 'Nội dung câu hỏi',
                'question_type' => 'Loại câu hỏi',
                'required' => 'Bắt buộc',
                'help_text' => 'Văn bản trợ giúp',
                'max_length' => 'Độ dài tối đa',
                'points' => 'Điểm',
                'question_code' => 'Mã câu hỏi',
            ];
            
            foreach ($fieldLabels as $field => $label) {
                if (isset($input[$field]) && $oldQuestion->$field != $input[$field]) {
                    $oldValue = $oldQuestion->$field ?: '(trống)';
                    $newValue = $input[$field] ?: '(trống)';
                    $changes[] = "{$label}: \"{$oldValue}\" → \"{$newValue}\"";
                }
            }
            
            // Tạo message log
            $logMessage = "Cập nhật câu hỏi: {$question->question_text}";
            if (!empty($changes)) {
                $logMessage .= " | Thay đổi: " . implode(', ', $changes);
            }
            
            // Ghi audit log
            $this->auditLogService->log(
                $question->survey_id,
                'update',
                'question',
                $id,
                $logMessage
            );
            
            return $question;
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
            // Lấy thông tin question trước khi xóa
            $question = $this->questionRepository->findById($id);
            $surveyId = $question->survey_id;
            $questionText = $question->question_text;
            
            $this->questionRepository->delete($id);
            
            // Ghi audit log
            $this->auditLogService->log(
                $surveyId,
                'delete',
                'question',
                $id,
                "Xóa câu hỏi: {$questionText}"
            );
            
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

            // Tạo question code mới - tìm số lớn nhất và tăng lên
            $newQuestion->question_code = $this->generateNextQuestionCode($originalQuestion->survey_id);

            $newQuestion->save();

            // Ghi audit log
            $this->auditLogService->log(
                $originalQuestion->survey_id,
                'duplicate',
                'question',
                $newQuestion->id,
                "Sao chép câu hỏi: {$newQuestion->question_text}"
            );

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
