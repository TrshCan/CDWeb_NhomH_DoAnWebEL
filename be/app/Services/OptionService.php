<?php

namespace App\Services;

use App\Repositories\OptionRepository;
use Illuminate\Support\Facades\Log;

class OptionService
{
    protected $optionRepository;

    public function __construct(OptionRepository $optionRepository)
    {
        $this->optionRepository = $optionRepository;
    }

    /**
     * Tạo option mới
     */
    public function createOption(array $input)
    {
        try {
            $option = $this->optionRepository->create($input);
            return $option->load('question');
        } catch (\Exception $e) {
            Log::error('Error creating option: ' . $e->getMessage());
            throw new \Exception('Không thể tạo option: ' . $e->getMessage());
        }
    }

    /**
     * Cập nhật option
     */
    public function updateOption($id, array $input)
    {
        try {
            return $this->optionRepository->update($id, $input);
        } catch (\Exception $e) {
            Log::error('Error updating option: ' . $e->getMessage());
            throw new \Exception('Không thể cập nhật option: ' . $e->getMessage());
        }
    }

    /**
     * Xóa option
     */
    public function deleteOption($id)
    {
        try {
            // Xóa các answers liên quan trước
            $this->optionRepository->clearRelatedAnswers($id);
            
            // Xóa option
            $this->optionRepository->delete($id);
            
            return true;
        } catch (\Exception $e) {
            Log::error('Error deleting option: ' . $e->getMessage());
            throw new \Exception('Không thể xóa option: ' . $e->getMessage());
        }
    }
}
