<?php

namespace App\Services;

use App\Repositories\DuplicateRepository;
// use Illuminate\Support\Facades\Auth; // Tạm thời comment vì chưa cần check đăng nhập
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Exception;

/**
 * Service xử lý sao chép survey
 * 
 * Chức năng: Sao chép survey với tất cả thông tin (title, description, categories_id, type, 
 * start_at, end_at, time_limit, points, object, status, allow_review) cùng với 
 * tất cả questions và options của survey
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
     * Sao chép survey với tất cả thông tin bao gồm questions và options
     * 
     * @param int $surveyId ID của survey cần sao chép
     * @return \App\Models\Survey Survey đã được sao chép
     * @throws ModelNotFoundException Khi không tìm thấy survey
     * @throws Exception Khi có lỗi xảy ra trong quá trình sao chép
     */
    public function duplicate(int $surveyId): \App\Models\Survey
    {
        try {
            // Sử dụng database transaction để đảm bảo tính toàn vẹn dữ liệu
            // Nếu có lỗi xảy ra ở bất kỳ bước nào, tất cả thay đổi sẽ được rollback
            return DB::transaction(function () use ($surveyId) {
                // 1. Lấy survey gốc
                $original = $this->repository->findById($surveyId);

                // 2. Kiểm tra survey có bị soft-deleted không (findOrFail đã xử lý, nhưng kiểm tra thêm để rõ ràng)
                if ($original->trashed()) {
                    throw new Exception("Khảo sát đã bị xóa.", 404);
                }

                // 3. Chuẩn bị dữ liệu bản sao
                // Lấy tất cả dữ liệu từ survey gốc
                $surveyData = $original->toArray();
                
                // Xóa các trường không cần sao chép
                unset(
                    $surveyData['id'],           // ID mới sẽ được tự động tạo
                    $surveyData['created_at'],   // Thời gian tạo mới
                    $surveyData['updated_at'],   // Thời gian cập nhật mới
                    $surveyData['deleted_at'],   // Không sao chép trạng thái xóa
                    $surveyData['questions']     // Questions sẽ được sao chép riêng
                );

                // 4. Cập nhật thông tin cho bản sao
                // Xử lý title: nếu null hoặc rỗng, sử dụng giá trị mặc định
                $originalTitle = $surveyData['title'] ?? '';
                if (empty($originalTitle)) {
                    $originalTitle = 'Khảo sát không có tiêu đề';
                }
                $surveyData['title'] = $this->generateCopyTitle($originalTitle);
                
                // Kiểm tra thời gian để xác định status
                // Sử dụng trực tiếp từ model gốc để lấy Carbon instance (không dùng toArray() vì sẽ convert sang string)
                // Nếu end_at đã qua thì set status là 'closed', ngược lại là 'pending'
                $surveyData['status'] = $this->determineStatus($original->end_at);
                
                // Đảm bảo created_by luôn có giá trị (required bởi database)
                // Nếu không có Auth, giữ nguyên giá trị từ survey gốc
                // $surveyData['created_by'] = Auth::id() ?? $original->created_by; // Tạm thời comment
                if (empty($surveyData['created_by'])) {
                    throw new Exception("Không thể xác định người tạo khảo sát.", 500);
                }
                
                $surveyData['created_at'] = now();
                $surveyData['updated_at'] = now();

                // 5. Tạo bản sao survey
                $duplicatedSurvey = $this->repository->createDuplicate($surveyData);

                // 6. Sao chép questions và options từ database trực tiếp
                $this->duplicateQuestions($original, $duplicatedSurvey);

                // 7. Load lại survey với creator_name để trả về đầy đủ dữ liệu
                $duplicatedSurvey->refresh();

                return $duplicatedSurvey;
            });

        } catch (ModelNotFoundException $e) {
            // Survey không tồn tại hoặc đã bị soft-delete
            throw new Exception("Khảo sát không tồn tại.", 404);
        } catch (Exception $e) {
            // Log lỗi để debug
            \Log::error('Duplicate survey failed', [
                'survey_id' => $surveyId,
                // 'user_id' => Auth::id(), // Tạm thời comment
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            // Nếu đã là Exception với message rõ ràng, throw lại
            if ($e->getCode() === 404 || $e->getCode() === 500) {
                throw $e;
            }
            
            throw new Exception("Không thể sao chép khảo sát: " . $e->getMessage(), 500);
        }
    }

    /**
     * Sao chép tất cả questions và options của survey
     * 
     * @param \App\Models\Survey $original Survey gốc
     * @param \App\Models\Survey $duplicated Survey đã được sao chép
     * @return void
     * @throws Exception Khi có lỗi xảy ra trong quá trình sao chép
     */
    private function duplicateQuestions(\App\Models\Survey $original, \App\Models\Survey $duplicated): void
    {
        try {
            // Lấy questions từ database trực tiếp
            $questions = DB::table('survey_questions')
                ->where('survey_id', $original->id)
                ->get();

            foreach ($questions as $originalQuestion) {
                $questionText = $originalQuestion->question_text ?? '';
                if (empty(trim($questionText))) {
                    \Log::warning('Skipping question with empty text', [
                        'question_id' => $originalQuestion->id,
                        'survey_id' => $original->id
                    ]);
                    continue;
                }

                // Tạo question mới
                $newQuestionId = DB::table('survey_questions')->insertGetId([
                    'survey_id' => $duplicated->id,
                    'question_text' => $questionText,
                    'question_type' => $originalQuestion->question_type ?? 'text',
                    'points' => $originalQuestion->points ?? 0,
                ]);

                // Sao chép options chỉ khi question_type không phải là 'text'
                if (($originalQuestion->question_type ?? 'text') !== 'text') {
                    $options = DB::table('survey_options')
                        ->where('question_id', $originalQuestion->id)
                        ->get();

                    foreach ($options as $originalOption) {
                        $optionText = $originalOption->option_text ?? '';
                        if (empty(trim($optionText))) {
                            \Log::warning('Skipping option with empty text', [
                                'option_id' => $originalOption->id,
                                'question_id' => $originalQuestion->id
                            ]);
                            continue;
                        }

                        DB::table('survey_options')->insert([
                            'question_id' => $newQuestionId,
                            'option_text' => $optionText,
                            'is_correct' => $originalOption->is_correct ?? false,
                        ]);
                    }
                }
            }
        } catch (Exception $e) {
            // Log lỗi chi tiết
            \Log::error('Duplicate questions failed', [
                'original_survey_id' => $original->id,
                'duplicated_survey_id' => $duplicated->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            throw new Exception("Không thể sao chép câu hỏi và lựa chọn: " . $e->getMessage(), 500);
        }
    }

    /**
     * Xác định status cho survey bản sao dựa trên thời gian
     * 
     * @param \Carbon\Carbon|string|null $endAt Thời gian kết thúc (có thể null, Carbon instance, hoặc string)
     * @return string Status: 'closed' nếu đã quá thời gian, 'pending' nếu chưa
     */
    private function determineStatus($endAt): string
    {
        // Nếu không có end_at (null), mặc định là pending
        // Sử dụng is_null() thay vì empty() vì Carbon instance là object, không bao giờ "empty"
        if (is_null($endAt)) {
            return 'pending';
        }

        try {
            // Xử lý cả trường hợp end_at là string hoặc Carbon instance
            if ($endAt instanceof Carbon) {
                $endDateTime = $endAt;
            } else {
                // Thử parse end_at từ string (trường hợp dữ liệu từ database chưa được cast)
                $endDateTime = Carbon::parse($endAt);
            }

            $now = now();

            // Nếu đã quá thời gian kết thúc, set status là 'closed'
            if ($now->greaterThan($endDateTime)) {
                return 'closed';
            }

            // Nếu chưa quá thời gian, set status là 'pending'
            return 'pending';
        } catch (\Exception $e) {
            // Nếu không parse được date, log warning và mặc định là 'pending'
            \Log::warning('Failed to parse end_at date', [
                'end_at' => $endAt,
                'error' => $e->getMessage()
            ]);
            return 'pending';
        }
    }

    /**
     * Tạo tiêu đề bản sao: [Bản sao] Tiêu đề cũ...
     * 
     * @param string $title Tiêu đề gốc
     * @return string Tiêu đề đã được thêm prefix [Bản sao]
     */
    private function generateCopyTitle(string $title): string
    {
        // Xử lý trường hợp title null hoặc rỗng
        if (empty(trim($title))) {
            $title = 'Khảo sát không có tiêu đề';
        }

        $prefix = '[Bản sao] ';
        $maxLength = 255 - strlen($prefix); // Đảm bảo không vượt quá độ dài tối đa của cột title

        // Nếu title đã có prefix [Bản sao], không thêm nữa (tránh [Bản sao] [Bản sao] ...)
        if (strpos($title, $prefix) === 0) {
            // Nếu title (đã có prefix) quá dài, cắt bớt
            if (strlen($title) > 255) {
                return substr($title, 0, 252) . '...';
            }
            return $title;
        }

        // Nếu title quá dài sau khi thêm prefix, cắt bớt và thêm "..."
        if (strlen($title) > $maxLength) {
            $title = substr($title, 0, $maxLength - 3) . '...';
        }

        return $prefix . $title;
    }
}