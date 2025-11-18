<?php

namespace App\GraphQL\Resolvers;

use App\Models\SurveyQuestion;
use App\Models\Survey;
use Illuminate\Support\Facades\Auth;

class QuestionResolver
{
    /**
     * Thêm câu hỏi mới vào survey
     */
    public function create($rootValue, array $args)
    {
        $input = $args['input'];
        
        // Kiểm tra survey có tồn tại không
        $survey = Survey::findOrFail($input['survey_id']);
        
        // Kiểm tra quyền (optional - có thể bỏ qua nếu chưa có auth)
        // if (Auth::id() !== $survey->created_by) {
        //     throw new \Exception('Bạn không có quyền thêm câu hỏi vào survey này');
        // }
        
        // Tạo question code tự động nếu không có
        if (empty($input['question_code'])) {
            $questionCount = $survey->questions()->count();
            $input['question_code'] = 'Q' . str_pad($questionCount + 1, 3, '0', STR_PAD_LEFT);
        }
        
        // Set giá trị mặc định
        $input['required'] = $input['required'] ?? 'none';
        $input['points'] = $input['points'] ?? 0;
        
        // Tạo câu hỏi
        $question = SurveyQuestion::create($input);
        
        // Load relationships
        $question->load(['survey', 'options']);
        
        return $question;
    }
    
    /**
     * Lấy thông tin câu hỏi
     */
    public function find($rootValue, array $args)
    {
        $question = SurveyQuestion::with(['survey', 'options'])
            ->findOrFail($args['id']);
        
        return $question;
    }
    
    /**
     * Xóa câu hỏi
     */
    public function delete($rootValue, array $args)
    {
        $question = SurveyQuestion::findOrFail($args['id']);
        
        // Kiểm tra quyền (optional - có thể bỏ qua nếu chưa có auth)
        // if (Auth::id() !== $question->survey->created_by) {
        //     throw new \Exception('Bạn không có quyền xóa câu hỏi này');
        // }
        
        // Xóa câu hỏi (cascade delete sẽ tự động xóa options và answers)
        $question->delete();
        
        return true;
    }
    
    /**
     * Xóa nhiều câu hỏi cùng lúc (batch delete) - Tối ưu hơn
     */
    public function deleteBatch($rootValue, array $args)
    {
        $ids = $args['ids'];
        
        if (empty($ids)) {
            return true;
        }
        
        // Kiểm tra quyền (optional - có thể bỏ qua nếu chưa có auth)
        // $questions = SurveyQuestion::whereIn('id', $ids)->get();
        // foreach ($questions as $question) {
        //     if (Auth::id() !== $question->survey->created_by) {
        //         throw new \Exception('Bạn không có quyền xóa một số câu hỏi');
        //     }
        // }
        
        // Xóa tất cả câu hỏi trong một query (nhanh hơn nhiều so với xóa từng cái)
        // Cascade delete sẽ tự động xóa options và answers
        SurveyQuestion::whereIn('id', $ids)->delete();
        
        return true;
    }
}
