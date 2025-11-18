<?php

namespace App\GraphQL\Resolvers;

use App\Models\SurveyQuestion;
use App\Models\SurveyOption;
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
     * Cập nhật câu hỏi
     */
    public function update($rootValue, array $args)
    {
        $question = SurveyQuestion::findOrFail($args['id']);
        $input = $args['input'];
        
        // Kiểm tra quyền (optional - có thể bỏ qua nếu chưa có auth)
        // if (Auth::id() !== $question->survey->created_by) {
        //     throw new \Exception('Bạn không có quyền cập nhật câu hỏi này');
        // }
        
        // Chỉ cập nhật các field có trong input (partial update)
        $question->fill($input);
        $question->save();
        
        // Load relationships
        $question->load(['survey', 'options']);
        
        return $question;
    }
    
    /**
     * Tạo option mới
     */
    public function createOption($rootValue, array $args)
    {
        $input = $args['input'];
        
        // Kiểm tra question có tồn tại không
        $question = SurveyQuestion::findOrFail($input['question_id']);
        
        // Kiểm tra quyền (optional - có thể bỏ qua nếu chưa có auth)
        // if (Auth::id() !== $question->survey->created_by) {
        //     throw new \Exception('Bạn không có quyền thêm option vào câu hỏi này');
        // }
        
        // Set giá trị mặc định
        $input['option_text'] = $input['option_text'] ?? '';
        $input['is_subquestion'] = $input['is_subquestion'] ?? false;
        $input['is_correct'] = $input['is_correct'] ?? false;
        
        // Nếu không có position, đặt position = số options hiện tại + 1
        if (!isset($input['position'])) {
            $maxPosition = $question->options()->max('position') ?? 0;
            $input['position'] = $maxPosition + 1;
        }
        
        // Tạo option
        $option = SurveyOption::create($input);
        
        // Load relationship
        $option->load('question');
        
        return $option;
    }
    
    /**
     * Cập nhật option
     */
    public function updateOption($rootValue, array $args)
    {
        $option = SurveyOption::findOrFail($args['id']);
        $input = $args['input'];
        
        // Kiểm tra quyền (optional - có thể bỏ qua nếu chưa có auth)
        // $question = $option->question;
        // if (Auth::id() !== $question->survey->created_by) {
        //     throw new \Exception('Bạn không có quyền cập nhật option này');
        // }
        
        // Chỉ cập nhật các field có trong input (partial update)
        $option->fill($input);
        $option->save();
        
        // Load relationship
        $option->load('question');
        
        return $option;
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
    
    /**
     * Xóa option
     */
    public function deleteOption($rootValue, array $args)
    {
        $option = SurveyOption::findOrFail($args['id']);
        
        // Kiểm tra quyền (optional - có thể bỏ qua nếu chưa có auth)
        // $question = $option->question;
        // if (Auth::id() !== $question->survey->created_by) {
        //     throw new \Exception('Bạn không có quyền xóa option này');
        // }
        
        // Xóa option
        $option->delete();
        
        return true;
    }
}
