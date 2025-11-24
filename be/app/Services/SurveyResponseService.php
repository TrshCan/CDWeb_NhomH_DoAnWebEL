<?php

namespace App\Services;

use App\Models\SurveyAnswer;
use App\Models\SurveyQuestion;
use App\Models\SurveyOption;
use App\Models\SurveyResult;
use App\Models\Survey;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SurveyResponseService
{
    /**
     * Submit câu trả lời của người dùng và tính điểm
     */
    public function submitSurveyResponse($surveyId, $userId, array $answers)
    {
        try {
            DB::beginTransaction();

            $survey = Survey::findOrFail($surveyId);
            $totalScore = 0;
            $maxScore = 0;

            // Lưu từng câu trả lời và tính điểm
            foreach ($answers as $answerData) {
                $questionId = $answerData['question_id'];
                $question = SurveyQuestion::with('options')->findOrFail($questionId);
                
                // Tính điểm tối đa
                $maxScore += $question->points ?? 0;

                // Tính điểm cho câu trả lời này
                $score = $this->calculateAnswerScore($question, $answerData);
                $totalScore += $score;

                // Lưu câu trả lời
                $this->saveAnswer($questionId, $userId, $answerData, $score);
            }

            // Lưu kết quả tổng
            $result = SurveyResult::updateOrCreate(
                [
                    'survey_id' => $surveyId,
                    'user_id' => $userId,
                ],
                [
                    'total_score' => $totalScore,
                    'max_score' => $maxScore,
                    'status' => 'completed',
                ]
            );

            DB::commit();

            return [
                'success' => true,
                'result' => $result,
                'total_score' => $totalScore,
                'max_score' => $maxScore,
                'percentage' => $maxScore > 0 ? round(($totalScore / $maxScore) * 100, 2) : 0,
            ];
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error submitting survey response: ' . $e->getMessage());
            throw new \Exception('Không thể lưu câu trả lời: ' . $e->getMessage());
        }
    }

    /**
     * Tính điểm cho một câu trả lời
     */
    private function calculateAnswerScore($question, $answerData)
    {
        $questionType = $question->question_type;
        $points = $question->points ?? 0;

        // Nếu không có điểm hoặc không phải quiz, trả về 0
        if ($points == 0) {
            return 0;
        }

        // Xử lý theo loại câu hỏi
        switch ($questionType) {
            case 'Văn bản ngắn':
            case 'Văn bản dài':
                return $this->checkTextAnswer($question, $answerData['answer_text'] ?? '');

            case 'Danh sách (nút chọn)':
            case 'Danh sách có nhận xét (Radio)':
            case 'Chọn hình ảnh từ danh sách (Radio)':
            case 'Giới tính':
            case 'Có/Không':
                return $this->checkSingleChoiceAnswer($question, $answerData['selected_option_id'] ?? null);

            case 'Nhiều lựa chọn':
            case 'Chọn nhiều hình ảnh':
                return $this->checkMultipleChoiceAnswer($question, $answerData['selected_option_ids'] ?? []);

            case 'Lựa chọn 5 điểm':
                return $this->checkFivePointAnswer($question, $answerData['selected_option_id'] ?? null);

            case 'Ma trận (chọn điểm)':
                return $this->checkMatrixAnswer($question, $answerData['matrix_answer'] ?? []);

            default:
                // Các loại câu hỏi khác không tính điểm
                return 0;
        }
    }

    /**
     * Kiểm tra đáp án văn bản (so sánh chính xác, không phân biệt hoa thường)
     */
    private function checkTextAnswer($question, $userAnswer)
    {
        // Tìm đáp án đúng trong options
        $correctOption = $question->options->where('is_correct', true)->first();
        
        if (!$correctOption || !$correctOption->option_text) {
            return 0;
        }

        $correctAnswer = trim($correctOption->option_text);
        $userAnswer = trim($userAnswer);

        // So sánh không phân biệt hoa thường
        if (mb_strtolower($correctAnswer) === mb_strtolower($userAnswer)) {
            return $question->points;
        }

        return 0;
    }

    /**
     * Kiểm tra đáp án đơn (radio button)
     */
    private function checkSingleChoiceAnswer($question, $selectedOptionId)
    {
        if (!$selectedOptionId) {
            return 0;
        }

        $selectedOption = $question->options->where('id', $selectedOptionId)->first();
        
        if ($selectedOption && $selectedOption->is_correct) {
            return $question->points;
        }

        return 0;
    }

    /**
     * Kiểm tra đáp án nhiều lựa chọn (checkbox)
     */
    private function checkMultipleChoiceAnswer($question, $selectedOptionIds)
    {
        if (empty($selectedOptionIds)) {
            return 0;
        }

        // Lấy tất cả đáp án đúng
        $correctOptionIds = $question->options->where('is_correct', true)->pluck('id')->toArray();
        
        if (empty($correctOptionIds)) {
            return 0;
        }

        // Chuyển về array để so sánh
        $selectedOptionIds = is_array($selectedOptionIds) ? $selectedOptionIds : [$selectedOptionIds];
        
        // So sánh: phải chọn đúng tất cả và không chọn thừa
        sort($correctOptionIds);
        sort($selectedOptionIds);

        if ($correctOptionIds == $selectedOptionIds) {
            return $question->points;
        }

        return 0;
    }

    /**
     * Kiểm tra đáp án 5 điểm
     */
    private function checkFivePointAnswer($question, $selectedOptionId)
    {
        // Tương tự như single choice
        return $this->checkSingleChoiceAnswer($question, $selectedOptionId);
    }

    /**
     * Kiểm tra đáp án ma trận
     */
    private function checkMatrixAnswer($question, $matrixAnswer)
    {
        if (empty($matrixAnswer)) {
            return 0;
        }

        // Lấy các subquestion (hàng) và options (cột)
        $subquestions = $question->options->where('is_subquestion', true);
        $regularOptions = $question->options->where('is_subquestion', false);

        $allCorrect = true;

        foreach ($subquestions as $subquestion) {
            $userSelectedId = $matrixAnswer[$subquestion->id] ?? null;
            
            if (!$userSelectedId) {
                $allCorrect = false;
                break;
            }

            // Kiểm tra xem có đáp án đúng cho subquestion này không
            $correctOption = $regularOptions->where('is_correct', true)->first();
            
            if ($correctOption && $userSelectedId != $correctOption->id) {
                $allCorrect = false;
                break;
            }
        }

        return $allCorrect ? $question->points : 0;
    }

    /**
     * Lưu câu trả lời vào database
     */
    private function saveAnswer($questionId, $userId, $answerData, $score)
    {
        $question = SurveyQuestion::findOrFail($questionId);
        $questionType = $question->question_type;

        // Tạo answer record
        $answer = SurveyAnswer::create([
            'question_id' => $questionId,
            'user_id' => $userId,
            'selected_option_id' => $answerData['selected_option_id'] ?? null,
            'answer_text' => $answerData['answer_text'] ?? null,
            'comment_text' => $answerData['comment_text'] ?? null,
            'matrix_answer' => $answerData['matrix_answer'] ?? null,
            'file_urls' => $answerData['file_urls'] ?? null,
            'answered_at' => now(),
            'score' => $score,
        ]);

        // Nếu là multiple choice, lưu vào bảng pivot
        if (isset($answerData['selected_option_ids']) && is_array($answerData['selected_option_ids'])) {
            $answer->selectedOptions()->attach($answerData['selected_option_ids']);
        }

        return $answer;
    }

    /**
     * Lấy kết quả của người dùng
     */
    public function getUserResult($surveyId, $userId)
    {
        $result = SurveyResult::where('survey_id', $surveyId)
            ->where('user_id', $userId)
            ->first();

        if (!$result) {
            return null;
        }

        return [
            'total_score' => $result->total_score,
            'max_score' => $result->max_score,
            'percentage' => $result->getPercentage(),
            'status' => $result->status,
            'created_at' => $result->created_at,
        ];
    }
}
