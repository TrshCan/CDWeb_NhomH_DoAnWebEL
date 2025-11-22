<?php

namespace App\Services;

use App\Repositories\DuplicateRepository;
use Illuminate\Support\Facades\Auth;
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
        // === KIỂM TRA QUYỀN: CHỈ ADMIN VÀ GIẢNG VIÊN ===
        $user = Auth::user();
        if (!$user) {
            throw new Exception('Bạn chưa đăng nhập. Vui lòng đăng nhập để sử dụng chức năng này.', 401);
        }

        if (!$user->isAdmin() && !$user->isLecturer()) {
            throw new Exception('Bạn không có quyền sao chép khảo sát. Chỉ admin và giáo viên mới có quyền này.', 403);
        }

        try {
            // Sử dụng database transaction để đảm bảo tính toàn vẹn dữ liệu
            // Nếu có lỗi xảy ra ở bất kỳ bước nào, tất cả thay đổi sẽ được rollback
            return DB::transaction(function () use ($surveyId, $user) {
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
                $surveyData['title'] = $this->generateCopyTitle($originalTitle, $user->id);
                
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
     * Tạo tiêu đề bản sao: [Bản sao] hoặc [Bản sao 2], [Bản sao 3]...
     * 
     * @param string $title Tiêu đề gốc
     * @param int $userId ID của user đang tạo bản sao
     * @return string Tiêu đề đã được thêm prefix [Bản sao] hoặc [Bản sao N]
     */
    private function generateCopyTitle(string $title, int $userId): string
    {
        // Xử lý trường hợp title null hoặc rỗng
        if (empty(trim($title))) {
            $title = 'Khảo sát không có tiêu đề';
        }

        // Lấy title gốc (bỏ prefix [Bản sao] hoặc [Bản sao N] nếu có)
        $baseTitle = $this->extractBaseTitle($title);
        
        // Tìm số lớn nhất đã tồn tại cho title này của cùng user
        $maxNumber = $this->findMaxCopyNumber($baseTitle, $userId);
        
        // Tạo prefix với số tiếp theo
        if ($maxNumber === 0) {
            $prefix = '[Bản sao] ';
        } else {
            $prefix = '[Bản sao ' . ($maxNumber + 1) . '] ';
        }
        
        $maxLength = 255 - strlen($prefix); // Đảm bảo không vượt quá độ dài tối đa của cột title

        // Nếu title quá dài sau khi thêm prefix, cắt bớt và thêm "..."
        if (strlen($baseTitle) > $maxLength) {
            $baseTitle = substr($baseTitle, 0, $maxLength - 3) . '...';
        }

        return $prefix . $baseTitle;
    }

    /**
     * Lấy title gốc (bỏ prefix [Bản sao] hoặc [Bản sao N] nếu có)
     * 
     * @param string $title Title có thể có prefix
     * @return string Title gốc không có prefix (đã trim)
     */
    private function extractBaseTitle(string $title): string
    {
        // Pattern: [Bản sao] hoặc [Bản sao N] ở đầu
        // Sử dụng flag 'u' để hỗ trợ UTF-8
        if (preg_match('/^\[Bản sao(?:\s+(\d+))?\]\s+(.+)$/u', trim($title), $matches)) {
            return trim($matches[2]); // Trả về phần title sau prefix (đã trim)
        }
        
        return trim($title); // Nếu không có prefix, trả về nguyên title (đã trim)
    }

    /**
     * Tìm số lớn nhất đã tồn tại cho title này của cùng user
     * 
     * @param string $baseTitle Title gốc (không có prefix)
     * @param int $userId ID của user
     * @return int Số lớn nhất (0 nếu chưa có bản sao nào, 1 nếu có [Bản sao] không số)
     */
    private function findMaxCopyNumber(string $baseTitle, int $userId): int
    {
        // Chuẩn hóa baseTitle để so sánh
        $baseTitle = trim($baseTitle);
        
        if (empty($baseTitle)) {
            return 0;
        }
        
        // Tìm tất cả các survey của user này có title bắt đầu bằng [Bản sao
        $surveys = \App\Models\Survey::where('created_by', $userId)
            ->whereNull('deleted_at')
            ->where('title', 'like', '[Bản sao%')
            ->pluck('title')
            ->toArray();

        $maxNumber = 0;
        
        foreach ($surveys as $surveyTitle) {
            // Pattern: [Bản sao] hoặc [Bản sao N]
            // Sử dụng flag 'u' để hỗ trợ UTF-8
            if (preg_match('/^\[Bản sao(?:\s+(\d+))?\]\s+(.+)$/u', trim($surveyTitle), $matches)) {
                $titlePart = trim($matches[2]); // Trim để loại bỏ khoảng trắng thừa
                
                // Chuẩn hóa khoảng trắng để so sánh chính xác hơn
                $normalizedTitlePart = preg_replace('/\s+/', ' ', $titlePart);
                $normalizedBaseTitle = preg_replace('/\s+/', ' ', $baseTitle);
                
                // Chỉ tính nếu title phần sau khớp chính xác với baseTitle
                if ($normalizedTitlePart === $normalizedBaseTitle) {
                    // Nếu có số trong matches[1], dùng số đó
                    if (isset($matches[1]) && $matches[1] !== '') {
                        $number = (int)$matches[1];
                        $maxNumber = max($maxNumber, $number);
                    } else {
                        // Nếu không có số, đây là [Bản sao] không số, coi như số 1
                        $maxNumber = max($maxNumber, 1);
                    }
                }
            }
        }

        return $maxNumber;
    }
}