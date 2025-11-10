<?php

namespace App\Services;

use App\Repositories\DuplicateRepository;
// use Illuminate\Support\Facades\Auth; // Tạm thời comment vì chưa cần check đăng nhập
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Exception;

/**
 * Service xử lý sao chép survey
 * 
 * Chức năng: Sao chép survey với tất cả thông tin (title, description, categories_id, type, 
 * start_at, end_at, time_limit, points, object, status, allow_review)
 * 
 * Lưu ý: Chưa sao chép questions và options (sẽ thêm sau)
 */
class DuplicateService
{
    protected $repository;

    /**
     * Constructor
     * 
     * @param DuplicateRepository $repository
     */
    public function __construct(DuplicateRepository $repository)
    {
        $this->repository = $repository;
    }

    /**
     * Sao chép survey với tất cả thông tin
     * 
     * @param int $surveyId ID của survey cần sao chép
     * @return \App\Models\Survey Survey đã được sao chép
     * @throws ModelNotFoundException Khi không tìm thấy survey
     * @throws Exception Khi có lỗi xảy ra trong quá trình sao chép
     */
    public function duplicate(int $surveyId): \App\Models\Survey
    {
        try {
            // 1. Lấy survey gốc
            $original = $this->repository->findById($surveyId);

            // 2. Chuẩn bị dữ liệu bản sao
            // Lấy tất cả dữ liệu từ survey gốc
            $surveyData = $original->toArray();
            
            // Xóa các trường không cần sao chép
            unset(
                $surveyData['id'],           // ID mới sẽ được tự động tạo
                $surveyData['created_at'],   // Thời gian tạo mới
                $surveyData['updated_at'],   // Thời gian cập nhật mới
                $surveyData['deleted_at']    // Không sao chép trạng thái xóa
            );

            // 3. Cập nhật thông tin cho bản sao
            $surveyData['title'] = $this->generateCopyTitle($surveyData['title']); // Thêm prefix [Bản sao]
            $surveyData['status'] = 'pending'; // Trạng thái mặc định là pending
            // $surveyData['created_by'] = Auth::id(); // Tạm thời comment vì chưa cần check đăng nhập
            // Lưu ý: created_by sẽ giữ nguyên giá trị từ survey gốc nếu không set
            $surveyData['created_at'] = now();
            $surveyData['updated_at'] = now();

            // 4. Tạo bản sao survey
            $duplicatedSurvey = $this->repository->createDuplicate($surveyData);

            // TODO: Sau này sẽ thêm sao chép questions và options
            // $this->duplicateQuestions($original, $duplicatedSurvey);

            return $duplicatedSurvey;

        } catch (ModelNotFoundException $e) {
            // Survey không tồn tại
            throw new Exception("Khảo sát không tồn tại.", 404);
        } catch (Exception $e) {
            // Log lỗi để debug
            \Log::error('Duplicate survey failed', [
                'survey_id' => $surveyId,
                // 'user_id' => Auth::id(), // Tạm thời comment
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            throw new Exception("Không thể sao chép khảo sát: " . $e->getMessage(), 500);
        }
    }

    /**
     * TODO: Sao chép tất cả questions và options của survey
     * Sẽ được implement sau khi có đầy đủ models và relations
     * 
     * @param \App\Models\Survey $original Survey gốc
     * @param \App\Models\Survey $duplicated Survey đã được sao chép
     * @return void
     */
    /*
    private function duplicateQuestions(\App\Models\Survey $original, \App\Models\Survey $duplicated): void
    {
        foreach ($original->questions as $originalQuestion) {
            // Tạo question mới
            $newQuestion = $duplicated->questions()->create([
                'question_text' => $originalQuestion->question_text,
                'question_type' => $originalQuestion->question_type,
                'points' => $originalQuestion->points,
            ]);

            // Sao chép options của question
            foreach ($originalQuestion->options as $originalOption) {
                $newQuestion->options()->create([
                    'option_text' => $originalOption->option_text,
                    'is_correct' => $originalOption->is_correct,
                ]);
            }
        }
    }
    */

    /**
     * Tạo tiêu đề bản sao: [Bản sao] Tiêu đề cũ...
     * 
     * @param string $title Tiêu đề gốc
     * @return string Tiêu đề đã được thêm prefix [Bản sao]
     */
    private function generateCopyTitle(string $title): string
    {
        $prefix = '[Bản sao] ';
        $maxLength = 255 - strlen($prefix); // Đảm bảo không vượt quá độ dài tối đa của cột title

        // Nếu title đã có prefix [Bản sao], không thêm nữa (tránh [Bản sao] [Bản sao] ...)
        if (strpos($title, $prefix) === 0) {
            return $title;
        }

        // Nếu title quá dài, cắt bớt và thêm "..."
        if (strlen($title) > $maxLength) {
            $title = substr($title, 0, $maxLength - 3) . '...';
        }

        return $prefix . $title;
    }
}