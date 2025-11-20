<?php

namespace App\GraphQL\Resolvers;

use App\Services\QuestionService;
use App\Services\OptionService;

class QuestionResolver
{
    protected $questionService;
    protected $optionService;
    
    public function __construct(
        QuestionService $questionService,
        OptionService $optionService
    ) {
        $this->questionService = $questionService;
        $this->optionService = $optionService;
    }
    
    /**
     * Thêm câu hỏi mới vào survey
     */
    public function create($rootValue, array $args)
    {
        return $this->questionService->createQuestion($args['input']);
    }
    
    /**
     * Lấy thông tin câu hỏi
     */
    public function find($rootValue, array $args)
    {
        return $this->questionService->getQuestionById($args['id']);
    }
    
    /**
     * Cập nhật câu hỏi
     */
    public function update($rootValue, array $args)
    {
        return $this->questionService->updateQuestion($args['id'], $args['input']);
    }
    
    /**
     * Tạo option mới
     */
    public function createOption($rootValue, array $args)
    {
        return $this->optionService->createOption($args['input']);
    }
    
    /**
     * Cập nhật option
     */
    public function updateOption($rootValue, array $args)
    {
        return $this->optionService->updateOption($args['id'], $args['input']);
    }
    
    /**
     * Xóa câu hỏi
     */
    public function delete($rootValue, array $args)
    {
        return $this->questionService->deleteQuestion($args['id']);
    }
    
    /**
     * Xóa nhiều câu hỏi cùng lúc (batch delete)
     */
    public function deleteBatch($rootValue, array $args)
    {
        return $this->questionService->deleteQuestionsBatch($args['ids']);
    }
    
    /**
     * Xóa option
     */
    public function deleteOption($rootValue, array $args)
    {
        return $this->optionService->deleteOption($args['id']);
    }
    
    /**
     * Duplicate câu hỏi (sao chép câu hỏi và tất cả options)
     */
    public function duplicate($rootValue, array $args)
    {
        return $this->questionService->duplicateQuestion($args['id']);
    }
}
