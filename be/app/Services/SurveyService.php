<?php

namespace App\Services;

use App\Models\Survey;
use App\Repositories\SurveyRepository;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Exception;
use Illuminate\Support\Facades\Validator;
use App\Services\AuditLogService;
use Illuminate\Support\Facades\Log;

class SurveyService
{
    protected SurveyRepository $repo;
    protected $surveyRepository;
    protected $auditLogService;

    public function __construct(SurveyRepository $repo, SurveyRepository $surveyRepository,
        AuditLogService $auditLogService)
    {
        $this->repo = $repo;
        $this->surveyRepository = $surveyRepository;
        $this->auditLogService = $auditLogService;
    }
    public function listByCreatorWithStatus(int $createdBy)
    {
        $items = $this->repo->getByCreatorWithResponseCounts($createdBy);

        return $items->map(function ($row) {
            // Use the actual status from database
            // Database has: pending, active, paused, closed
            return [
                'id' => $row->id,
                'title' => $row->title,
                'created_at' => $row->created_at,
                'end_at' => $row->end_at,
                'status' => $row->status ?? 'pending', // Use database status directly
                'responses' => (int) ($row->responses ?? 0),
            ];
        });
    }

    public function getRawData(int $surveyId): array
    {
        // @var Collection $rawData
        $rawData = $this->repo->getRawDataBySurveyId($surveyId);
        $surveyTitle = $this->repo->getSurveyTitle($surveyId);

        return [
            'title' => $surveyTitle ?? 'Khảo sát',
            'responses' => $rawData->map(function ($row) {
                // Use the real faculty name; fall back to 'other' if missing
                $khoa = $row->faculty_name ?? 'other';

                // Format completed date (or 'N/A')
                $completedDate = $row->completed_date
                    ? Carbon::parse($row->completed_date)->format('d/m/Y H:i')
                    : 'N/A';

                // Use student_code if available, otherwise fall back to user_id
                $studentId = $row->student_code ?? (string) $row->user_id;

                return [
                    'id' => $row->response_id,
                    'studentId' => $studentId,
                    'studentName' => $row->student_name ?? 'N/A',
                    'khoa' => $khoa,
                    'completedDate' => $completedDate,
                ];
            })->values()->all(),
        ];
    }

    public function getSurveyOverview(int $surveyId): array
    {
        $surveyTitle = $this->repo->getSurveyTitle($surveyId);
        $questionsData = $this->repo->getSurveyOverviewData($surveyId);
        
        // Get total unique responses (count distinct users who answered)
        $totalResponses = DB::table('survey_answers')
            ->join('survey_questions', 'survey_questions.id', '=', 'survey_answers.question_id')
            ->where('survey_questions.survey_id', $surveyId)
            ->whereNull('survey_answers.deleted_at')
            ->select(DB::raw('COUNT(DISTINCT survey_answers.user_id) as total'))
            ->value('total') ?? 0;

        return [
            'title' => $surveyTitle ?? 'Khảo sát',
            'totalResponses' => $totalResponses,
            'questions' => $questionsData,
        ];
    }

    public function getResponseDetail(int $surveyId, string $responseId): ?array
    {
        $userId = $this->extractUserIdFromResponseId($responseId);
        if ($userId <= 0) {
            return null;
        }

        $survey = $this->repo->findSurveyWithQuestions($surveyId);
        if (!$survey) {
            return null;
        }

        $participant = $this->repo->getParticipantProfile($userId);
        if (!$participant) {
            return null;
        }

        $answers = $this->repo->getAnswersForSurveyAndUser($surveyId, $userId);
        $answersByQuestion = $answers->groupBy('question_id');

        $totalQuestions = $survey->questions->count();
        $answeredQuestions = $answersByQuestion->filter(function ($collection) {
            return $collection instanceof \Illuminate\Support\Collection && $collection->isNotEmpty();
        })->count();

        $maxScore = (float) $survey->questions->sum(function ($question) {
            return (float) ($question->points ?? 0);
        });

        $totalScore = (float) $answers->sum(function ($answer) {
            return (float) ($answer->score ?? 0);
        });

        $scorePercentage = $maxScore > 0
            ? round(($totalScore / $maxScore) * 100, 2)
            : null;

        $firstAnsweredAt = $answers->min('answered_at');
        $lastAnsweredAt = $answers->max('answered_at');

        $completionTime = $this->formatCompletionTime($firstAnsweredAt, $lastAnsweredAt);
        $completedAt = $this->formatCompletedAt($lastAnsweredAt);

        $questions = $survey->questions->map(function ($question) use ($answersByQuestion) {
            $questionAnswers = $answersByQuestion->get($question->id, collect());
            $questionAnswers = $questionAnswers instanceof \Illuminate\Support\Collection
                ? $questionAnswers
                : collect($questionAnswers);

            $score = $questionAnswers->sum(function ($answer) {
                return (float) ($answer->score ?? 0);
            });

            $answerText = null;
            $options = null;

            if ($question->question_type === 'text') {
                $firstAnswer = $questionAnswers->first();
                $answerText = $firstAnswer ? ($firstAnswer->answer_text ?? null) : null;
            } else {
                $selectedOptionIds = $questionAnswers
                    ->pluck('selected_option_id')
                    ->filter()
                    ->map(fn ($id) => (int) $id)
                    ->values()
                    ->all();

                $options = $question->options->map(function ($option) use ($selectedOptionIds) {
                    $optionId = (int) $option->id;
                    return [
                        'id' => (string) $optionId,
                        'text' => $option->option_text,
                        'selected' => in_array($optionId, $selectedOptionIds, true),
                        'isCorrect' => (bool) $option->is_correct,
                    ];
                })->values()->all();
            }

            return [
                'id' => (string) $question->id,
                'question' => $question->question_text,
                'type' => $question->question_type,
                'answerText' => $answerText,
                'options' => $options,
                'score' => round($score, 2),
                'points' => (float) ($question->points ?? 0),
            ];
        })->values()->all();

        $navigationIds = $this->repo->getResponseIdsForSurvey($surveyId);
        $navigation = null;
        $currentIndex = array_search($responseId, $navigationIds, true);
        if ($currentIndex !== false) {
            $navigation = [
                'previous' => $navigationIds[$currentIndex + 1] ?? null,
                'next' => $currentIndex > 0 ? ($navigationIds[$currentIndex - 1] ?? null) : null,
            ];
        }

        return [
            'responseId' => $responseId,
            'surveyId' => $surveyId,
            'surveyTitle' => $survey->title,
            'participant' => [
                'name' => $participant->name ?? 'N/A',
                'studentId' => $participant->student_code ?? null,
                'faculty' => $participant->faculty_name ?? null,
                'class' => $participant->class_name ?? null,
                'completedAt' => $completedAt,
            ],
            'stats' => [
                'completionTime' => $completionTime,
                'answeredQuestions' => $answeredQuestions,
                'totalQuestions' => $totalQuestions,
                'totalScore' => round($totalScore, 2),
                'maxScore' => round($maxScore, 2),
                'scorePercentage' => $scorePercentage,
            ],
            'questions' => $questions,
            'navigation' => $navigation,
        ];
    }

    protected function extractUserIdFromResponseId(string $responseId): int
    {
        $parts = array_filter(explode('-', $responseId), fn ($part) => $part !== '');
        if (empty($parts)) {
            return 0;
        }

        $userPart = array_pop($parts);
        return (int) $userPart;
    }

    protected function formatCompletionTime($start, $end): ?string
    {
        if (!$start || !$end) {
            return null;
        }

        $startCarbon = $start instanceof Carbon ? $start : Carbon::parse($start);
        $endCarbon = $end instanceof Carbon ? $end : Carbon::parse($end);

        if ($endCarbon->lessThanOrEqualTo($startCarbon)) {
            return '0s';
        }

        $diffInSeconds = $endCarbon->diffInSeconds($startCarbon);

        $hours = intdiv($diffInSeconds, 3600);
        $minutes = intdiv($diffInSeconds % 3600, 60);
        $seconds = $diffInSeconds % 60;

        $parts = [];
        if ($hours > 0) {
            $parts[] = $hours . 'h';
        }
        if ($minutes > 0 || $hours > 0) {
            $parts[] = $minutes . 'm';
        }
        $parts[] = $seconds . 's';

        return implode(' ', $parts);
    }

    protected function formatCompletedAt($value): ?string
    {
        if (!$value) {
            return null;
        }

        $carbon = $value instanceof Carbon ? $value : Carbon::parse($value);
        return $carbon->format('d/m/Y H:i');
    }

     public function listCompletedByUser(int $userId)
    {
        $items = $this->repo->getCompletedByUser($userId);
        return $items->map(function ($row) {
            $canView = ($row->object ?? 'public') === 'public';
            return [
                'id' => $row->id,
                'name' => $row->name,
                'creator' => $row->creator,
                'completedAt' => $row->completedAt,
                'canView' => (bool) $canView,
            ];
        });
    }

    /**
     * TẠO KHẢO SÁT – CHỈ XỬ LÝ METADATA
     */
    public function createSurvey(array $data): Survey
    {
        // === KIỂM TRA QUYỀN: CHỈ ADMIN VÀ GIẢNG VIÊN ===
        $user = Auth::user();
        if (!$user) {
            throw new Exception('Bạn chưa đăng nhập. Vui lòng đăng nhập để sử dụng chức năng này.', 401);
        }

        if (!$user->isAdmin() && !$user->isLecturer()) {
            throw new Exception('Bạn không có quyền tạo khảo sát. Chỉ admin và giáo viên mới có quyền này.', 403);
        }

        // GÁN MẶC ĐỊNH
        $data = array_merge([
            'type' => 'survey',
            'object' => 'public',
            'points' => 0,
            'status' => 'pending',
            'description' => '',
            'time_limit' => null,
            'start_at' => null,
            'end_at' => null,
        ], $data);

        // === PREVENT DUPLICATE SUBMISSIONS USING CACHE LOCK ===
        $lockKey = 'survey_create_' . md5(json_encode($data) . ($data['created_by'] ?? ''));
        $lock = \Illuminate\Support\Facades\Cache::lock($lockKey, 5); // 5 seconds lock

        if (!$lock->get()) {
            throw new Exception("Đang xử lý yêu cầu. Vui lòng đợi và thử lại sau vài giây.", 429);
        }

        try {
            // === KIỂM TRA TRÙNG TIÊU ĐỀ CỦA CÙNG NGƯỜI TẠO ===
            if (!empty($data['title']) && !empty($data['created_by'])) {
                $exists = Survey::where('title', $data['title'])
                    ->where('created_by', $data['created_by'])
                    ->whereNull('deleted_at')
                    ->exists();

                if ($exists) {
                    $validator = Validator::make([], []);
                    $validator->errors()->add('title', 'Tiêu đề khảo sát đã tồn tại. Vui lòng chọn tiêu đề khác.');
                    throw new ValidationException($validator);
                }
            }

        // === VALIDATION TIẾNG VIỆT ===
        $rules = [
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'categories_id' => 'required|integer|exists:categories,id',
            'type' => 'required|in:survey,quiz',
            'start_at' => 'required|date_format:Y-m-d H:i:s|after:now',
            'end_at' => 'required|date_format:Y-m-d H:i:s|after:start_at',
            'time_limit' => 'nullable|integer|min:1',
            'object' => 'required|in:public,students,lecturers',
            'created_by' => 'required|integer|exists:users,id',
            'status' => 'sometimes|in:pending,active,paused,closed',
        ];

        // Nếu là quiz → yêu cầu points
        if (isset($data['type']) && $data['type'] === 'quiz') {
            $rules['points'] = 'required|integer|min:0|max:100';
        } else {
            // Nếu là survey → ép points = 0
            $data['points'] = 0;
        }

        $messages = [
            'title.required' => 'Tiêu đề là bắt buộc.',
            'title.max' => 'Tiêu đề không được quá 255 ký tự.',
            'description.required' => 'Mô tả khảo sát không được để trống.',
            'categories_id.required' => 'Vui lòng chọn danh mục.',
            'categories_id.exists' => 'Danh mục không tồn tại.',
            'type.required' => 'Loại khảo sát là bắt buộc.',
            'type.in' => 'Loại phải là "survey" hoặc "quiz".',
            'start_at.required' => 'Thời gian bắt đầu là bắt buộc.',
            'start_at.after' => 'Thời gian bắt đầu phải lớn hơn thời gian tạo khảo sát.',
            'end_at.required' => 'Thời gian kết thúc là bắt buộc.',
            'end_at.after' => 'Thời gian kết thúc phải lớn hơn thời gian bắt đầu.',
            'time_limit.min' => 'Giới hạn thời gian phải là số nguyên dương.',
            'points.required' => 'Điểm là bắt buộc khi loại là quiz.',
            'points.integer' => 'Điểm phải là số nguyên.',
            'points.min' => 'Điểm không được nhỏ hơn 0.',
            'points.max' => 'Điểm không được lớn hơn 100.',
            'object.required' => 'Đối tượng tham gia là bắt buộc.',
            'object.in' => 'Đối tượng tham gia không hợp lệ.',
            'created_by.required' => 'Người tạo là bắt buộc.',
            'created_by.exists' => 'Người dùng không tồn tại.',
        ];

        $validator = Validator::make($data, $rules, $messages);

        if ($validator->fails()) {
            throw new ValidationException($validator);
        }

        // === KIỂM TRA start_at PHẢI LỚN HƠN created_at ===
        // Vì created_at sẽ được set khi save, nên kiểm tra start_at > now (đã có ở trên)
        // Nhưng để chắc chắn, kiểm tra thêm sau khi save
        if (isset($data['start_at'])) {
            $startAt = Carbon::parse($data['start_at']);
            $now = Carbon::now();
            
            // start_at phải lớn hơn thời điểm hiện tại (tức là lớn hơn created_at sẽ được set)
            if ($startAt->lte($now)) {
                $validator = Validator::make([], []);
                $validator->errors()->add('start_at', 'Thời gian bắt đầu phải lớn hơn thời gian tạo khảo sát.');
                throw new ValidationException($validator);
            }
        }

            try {
                DB::beginTransaction();
                $survey = $this->repo->create($data);
                
                // Kiểm tra lại sau khi save để đảm bảo start_at > created_at
                if ($survey->start_at && $survey->created_at) {
                    $startAt = Carbon::parse($survey->start_at);
                    $createdAt = Carbon::parse($survey->created_at);
                    
                    if ($startAt->lte($createdAt)) {
                        DB::rollBack();
                        $validator = Validator::make([], []);
                        $validator->errors()->add('start_at', 'Thời gian bắt đầu phải lớn hơn thời gian tạo khảo sát.');
                        throw new ValidationException($validator);
                    }
                }
                
                DB::commit();

                // Load lại survey với creator_name
                $surveyWithCreator = $this->repo->findWithCreatorNameAfterSave($survey->id);
                
                Log::info('Tạo khảo sát thành công', ['id' => $survey->id, 'title' => $survey->title]);
                return $surveyWithCreator ?: $survey;
            } catch (\Exception $e) {
                DB::rollBack();

                if ($e instanceof \Illuminate\Database\QueryException) {
                    if (str_contains($e->getMessage(), 'foreign key constraint')) {
                        throw new Exception('Danh mục hoặc người tạo không hợp lệ.', 422);
                    }
                    if (str_contains($e->getMessage(), 'Data too long')) {
                        throw new Exception('Tiêu đề quá dài.', 422);
                    }
                }

                Log::error('Lỗi tạo khảo sát', [
                    'error' => $e->getMessage(),
                    'data' => $data,
                    'trace' => $e->getTraceAsString()
                ]);

                throw new Exception('Không thể tạo khảo sát. Vui lòng thử lại.', 500);
            }
        } finally {
            // Release lock sau khi xong
            $lock->release();
        }
    }

    /**
     * XÓA KHẢO SÁT – SOFT DELETE
     */
    public function deleteSurvey(int $id): bool
    {
        // === KIỂM TRA QUYỀN: CHỈ ADMIN VÀ GIẢNG VIÊN ===
        $user = Auth::user();
        if (!$user) {
            throw new Exception('Bạn chưa đăng nhập. Vui lòng đăng nhập để sử dụng chức năng này.', 401);
        }

        if (!$user->isAdmin() && !$user->isLecturer()) {
            throw new Exception('Bạn không có quyền xóa khảo sát. Chỉ admin và giáo viên mới có quyền này.', 403);
        }

        try {
            DB::beginTransaction();

            // Kiểm tra xem survey đã bị soft delete chưa
            $deletedSurvey = $this->repo->findDeletedById($id);
            if ($deletedSurvey) {
                throw new Exception('Khảo sát đã bị xóa trước đó. Không thể xóa lại.', 422);
            }

            $survey = $this->repo->findById($id);
            if (!$survey) {
                throw new ModelNotFoundException("Khảo sát ID {$id} không tồn tại.");
            }

            // === KIỂM TRA ĐANG HOẠT ĐỘNG ===
            // Chỉ kiểm tra nếu có cả start_at và end_at và status là active
            // Bỏ qua kiểm tra này tạm thời để đảm bảo xóa hoạt động
            // Có thể bật lại sau khi xác định được nguyên nhân lỗi
            
            if ($survey->status === 'active' && $survey->start_at && $survey->end_at) {
                try {
                    $now = Carbon::now();
                    // start_at và end_at đã được cast thành Carbon instance trong Model
                    $startAt = $survey->start_at;
                    $endAt = $survey->end_at;
                    
                    // Kiểm tra nếu hiện tại đang trong khoảng thời gian diễn ra
                    if ($now->greaterThanOrEqualTo($startAt) && $now->lessThanOrEqualTo($endAt)) {
                        throw new Exception('Khảo sát đang được sử dụng, không thể xóa vào lúc này.', 403);
                    }
                } catch (\Exception $e) {
                    // Nếu là lỗi 403 (không được xóa), re-throw
                    if ($e->getCode() === 403) {
                        throw $e;
                    }
                    // Nếu có lỗi khác, bỏ qua kiểm tra này
                    Log::warning('Lỗi kiểm tra thời gian khi xóa survey', [
                        'id' => $id,
                        'error' => $e->getMessage()
                    ]);
                }
            }
            

            $survey->delete(); // Soft delete
            DB::commit();

            Log::info('Xóa khảo sát thành công (soft delete)', ['id' => $id]);
            return true;
        } catch (ModelNotFoundException $e) {
            DB::rollBack();
            Log::warning('Không tìm thấy khảo sát để xóa', ['id' => $id]);
            throw new Exception('Khảo sát không tồn tại hoặc đã bị xóa.', 404);
        } catch (\Exception $e) {
            DB::rollBack();
            $code = (int) $e->getCode();
            $message = $e->getMessage() ?: 'Không thể xóa khảo sát.';
            
            Log::error('Lỗi xóa khảo sát', [
                'id' => $id, 
                'error' => $message, 
                'code' => $code,
                'trace' => $e->getTraceAsString()
            ]);
            
            // Giữ nguyên thông điệp & mã lỗi có ý nghĩa để FE hiển thị đúng lý do
            if (in_array($code, [400, 403, 404, 422], true)) {
                throw new Exception($message, $code);
            }
            // Nếu là lỗi không có code hoặc code 0, throw với message gốc
            throw new Exception($message, $code ?: 500);
        }
    }

    /**
     * CẬP NHẬT KHẢO SÁT
     */
    public function updateSurvey2(int $id, array $data): Survey
    {
        // === KIỂM TRA QUYỀN: CHỈ ADMIN VÀ GIẢNG VIÊN ===
        $user = Auth::user();
        if (!$user) {
            throw new Exception('Bạn chưa đăng nhập. Vui lòng đăng nhập để sử dụng chức năng này.', 401);
        }

        if (!$user->isAdmin() && !$user->isLecturer()) {
            throw new Exception('Bạn không có quyền cập nhật khảo sát. Chỉ admin và giáo viên mới có quyền này.', 403);
        }

        // Kiểm tra survey có tồn tại không (bao gồm cả soft-deleted)
        $surveyExists = DB::table('surveys')
            ->where('id', $id)
            ->exists();
        
        if (!$surveyExists) {
            throw new Exception('Khảo sát không tồn tại trong cơ sở dữ liệu.', 404);
        }

        $survey = $this->repo->findById($id);
        if (!$survey) {
            throw new Exception('Khảo sát không tồn tại hoặc đã bị xóa.', 404);
        }

        // === OPTIMISTIC LOCKING: Kiểm tra updated_at ===
        if (isset($data['updated_at'])) {
            $clientUpdatedAt = Carbon::parse($data['updated_at']);
            $serverUpdatedAt = Carbon::parse($survey->updated_at);
            
            // So sánh timestamp (chính xác đến giây)
            if ($clientUpdatedAt->format('Y-m-d H:i:s') !== $serverUpdatedAt->format('Y-m-d H:i:s')) {
                $validator = Validator::make([], []);
                $validator->errors()->add('updated_at', 'Dữ liệu đã được cập nhật bởi người khác. Vui lòng tải lại trang trước khi cập nhật.');
                throw new ValidationException($validator);
            }
            // Xóa updated_at khỏi data vì không cần update field này
            unset($data['updated_at']);
        }

        $now = Carbon::now();
        if ($survey->start_at && $now->greaterThanOrEqualTo(Carbon::parse($survey->start_at))) {
            if (isset($data['start_at'])) {
                $validator = Validator::make([], []);
                throw new ValidationException($validator, response()->json([
                    'errors' => ['start_at' => ['Không thể chỉnh sửa thời gian bắt đầu khi khảo sát đã bắt đầu.']]
                ], 422));
            }
        }

        if (isset($data['type']) && $data['type'] !== $survey->type) {
            $hasResponses = DB::table('survey_responses')->where('survey_id', $id)->exists();
            if ($hasResponses) {
                $validator = Validator::make([], []);
                throw new ValidationException($validator, response()->json([
                    'errors' => ['type' => ['Không thể thay đổi loại khảo sát khi đã có người tham gia.']]
                ], 422));
            }
        }

        // Convert DateTime objects to strings for validation
        foreach (['start_at', 'end_at', 'created_at', 'updated_at'] as $dateField) {
            if (isset($data[$dateField]) && ($data[$dateField] instanceof \DateTime || $data[$dateField] instanceof \DateTimeInterface)) {
                $data[$dateField] = $data[$dateField]->format('Y-m-d H:i:s');
            }
        }

        // Xử lý logic points
        if (isset($data['type']) && $data['type'] === 'quiz') {
            $pointsRule = 'required|integer|min:0|max:100';
        } elseif (!isset($data['type']) && $survey->type === 'quiz') {
            $pointsRule = 'sometimes|integer|min:0|max:100';
        } else {
            // Nếu là survey thì không cho phép gửi/truyền trường points
            if (array_key_exists('points', $data)) {
                unset($data['points']);
            }
            $pointsRule = 'prohibited'; // Cấm gửi points
        }

        $validator = Validator::make($data, [
            'title' => 'sometimes|string|max:255',
            'description' => 'sometimes|string|nullable',
            'categories_id' => 'sometimes|integer|exists:categories,id',
            'type' => 'sometimes|in:survey,quiz',
            'start_at' => 'sometimes|date_format:Y-m-d H:i:s',
            'end_at' => 'sometimes|date_format:Y-m-d H:i:s|after:start_at',
            'time_limit' => 'nullable|integer|min:1',
            'points' => $pointsRule,
            'object' => 'sometimes|in:public,students,lecturers',
            'status' => 'sometimes|in:pending,active,paused,closed',
        ], [
            'end_at.after' => 'Thời gian kết thúc phải lớn hơn thời gian bắt đầu.',
            'points.required' => 'Điểm là bắt buộc khi loại là quiz.',
            'points.integer' => 'Điểm phải là số nguyên.',
            'points.min' => 'Điểm không được nhỏ hơn 0.',
            'points.max' => 'Điểm không được lớn hơn 100.',
            'points.prohibited' => 'Khảo sát thường không có điểm. Vui lòng bỏ trường điểm.',
        ]);

        if ($validator->fails()) {
            throw new ValidationException($validator);
        }

        // === KIỂM TRA start_at PHẢI LỚN HƠN created_at ===
        if (isset($data['start_at'])) {
            $startAt = Carbon::parse($data['start_at']);
            $createdAt = Carbon::parse($survey->created_at);
            
            // start_at phải lớn hơn created_at của survey
            if ($startAt->lte($createdAt)) {
                $validator = Validator::make([], []);
                $validator->errors()->add('start_at', 'Thời gian bắt đầu phải lớn hơn thời gian tạo khảo sát.');
                throw new ValidationException($validator);
            }
        }

        try {
            DB::beginTransaction();
            $updatedSurvey = $this->repo->update($survey, $data);
            
            // Kiểm tra lại sau khi update để đảm bảo start_at > created_at
            if ($updatedSurvey->start_at && $updatedSurvey->created_at) {
                $startAt = Carbon::parse($updatedSurvey->start_at);
                $createdAt = Carbon::parse($updatedSurvey->created_at);
                
                if ($startAt->lte($createdAt)) {
                    DB::rollBack();
                    $validator = Validator::make([], []);
                    $validator->errors()->add('start_at', 'Thời gian bắt đầu phải lớn hơn thời gian tạo khảo sát.');
                    throw new ValidationException($validator);
                }
            }
            
            DB::commit();

            // Load lại survey với creator_name
            $surveyWithCreator = $this->repo->findWithCreatorNameAfterSave($updatedSurvey->id);
            
            Log::info('Cập nhật khảo sát thành công', ['id' => $id, 'title' => $updatedSurvey->title]);
            return $surveyWithCreator ?: $updatedSurvey;
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Lỗi cập nhật khảo sát', ['id' => $id, 'data' => $data, 'error' => $e->getMessage()]);
            throw new Exception('Không thể cập nhật khảo sát.', 500);
        }
    }

    /**
     * LẤY CHI TIẾT
     */
    public function getSurveyById2(int $id): Survey
    {
        try {
            // Kiểm tra survey có tồn tại không (bao gồm cả soft-deleted)
            $surveyExists = DB::table('surveys')
                ->where('id', $id)
                ->exists();
            
            if (!$surveyExists) {
                throw new Exception('Khảo sát không tồn tại trong cơ sở dữ liệu.', 404);
            }

            $survey = $this->repo->findWithCreatorName($id);
            if (!$survey) {
                throw new ModelNotFoundException("Khảo sát ID {$id} không tồn tại hoặc đã bị xóa.");
            }
            return $survey;
        } catch (ModelNotFoundException $e) {
            Log::warning('Không tìm thấy khảo sát', ['id' => $id]);
            throw new Exception('Khảo sát không tồn tại hoặc đã bị xóa.', 404);
        } catch (\Exception $e) {
            // If it's already a 404 error, re-throw it
            if ($e->getCode() === 404) {
                throw $e;
            }
            Log::error('Lỗi tải chi tiết khảo sát', ['id' => $id, 'error' => $e->getMessage()]);
        }
    }

    /**
     * LẤY DANH SÁCH (có filter)
     */
    public function getAllSurveys2(int $perPage = 10, array $filters = [])
    {
        try {
            return $this->repo->getAllPaginated($perPage, $filters);
        } catch (\Exception $e) {
            Log::error('Lỗi tải danh sách khảo sát', ['error' => $e->getMessage()]);
            throw new Exception('Không thể tải danh sách khảo sát.', 500);
        }
    }

     /**
     * Lấy tất cả surveys
     */
    public function getAllSurveys(array $filters = [])
    {
        try {
            return $this->surveyRepository->getAll($filters);
        } catch (\Exception $e) {
            Log::error('Error getting surveys: ' . $e->getMessage());
            throw new \Exception('Không thể lấy danh sách surveys: ' . $e->getMessage());
        }
    }

    /**
     * Lấy survey theo ID
     */
    public function getSurveyById($id)
    {
        try {
            return $this->surveyRepository->findById($id);
        } catch (\Exception $e) {
            Log::error('Error getting survey: ' . $e->getMessage());
            throw new \Exception('Không thể lấy thông tin survey: ' . $e->getMessage());
        }
    }

    /**
     * Tạo survey mới
     */
    public function createSurvey2(array $input)
    {
        try {
            $survey = $this->surveyRepository->create($input);
            return $survey->load(['category', 'creator', 'questions', 'questionGroups']);
        } catch (\Exception $e) {
            Log::error('Error creating survey: ' . $e->getMessage());
            throw new \Exception('Không thể tạo survey: ' . $e->getMessage());
        }
    }

    /**
     * Cập nhật survey
     */
    public function updateSurvey($id, array $input)
    {
        try {
            // Lấy thông tin survey trước khi cập nhật
            $oldSurvey = $this->surveyRepository->findById($id);
            
            // Convert DateTime objects to strings for validation
            if (isset($input['start_at']) && ($input['start_at'] instanceof \DateTime || $input['start_at'] instanceof \DateTimeInterface)) {
                $input['start_at'] = $input['start_at']->format('Y-m-d H:i:s');
            }
            if (isset($input['end_at']) && ($input['end_at'] instanceof \DateTime || $input['end_at'] instanceof \DateTimeInterface)) {
                $input['end_at'] = $input['end_at']->format('Y-m-d H:i:s');
            }
            
            // Cập nhật survey - pass the Survey model object, not the ID
            $survey = $this->surveyRepository->update($oldSurvey, $input);
            
            // Tạo log chi tiết về những gì đã thay đổi
            $changes = [];
            
            // Kiểm tra các field quan trọng
            $fieldLabels = [
                'title' => 'Tiêu đề',
                'description' => 'Mô tả',
                'type' => 'Loại',
                'object' => 'Đối tượng',
                'status' => 'Trạng thái',
                'start_at' => 'Thời gian bắt đầu',
                'end_at' => 'Thời gian kết thúc',
                'time_limit' => 'Giới hạn thời gian',
                'points' => 'Điểm',
                'allow_review' => 'Cho phép xem lại',
            ];
            
            foreach ($fieldLabels as $field => $label) {
                if (isset($input[$field]) && $oldSurvey->$field != $input[$field]) {
                    $oldValue = $oldSurvey->$field;
                    $newValue = $input[$field];
                    
                    // Format giá trị DateTime
                    if ($oldValue instanceof \DateTime || $oldValue instanceof \DateTimeInterface) {
                        $oldValue = $oldValue->format('Y-m-d H:i:s');
                    }
                    if ($newValue instanceof \DateTime || $newValue instanceof \DateTimeInterface) {
                        $newValue = $newValue->format('Y-m-d H:i:s');
                    }
                    
                    // Format giá trị boolean
                    if (is_bool($oldValue) || is_bool($newValue)) {
                        $oldValue = $oldValue ? 'Có' : 'Không';
                        $newValue = $newValue ? 'Có' : 'Không';
                    }
                    
                    // Format giá trị rỗng
                    $oldValue = $oldValue ?: '(trống)';
                    $newValue = $newValue ?: '(trống)';
                    
                    $changes[] = "{$label}: \"{$oldValue}\" → \"{$newValue}\"";
                }
            }
            
            // Tạo message log
            $logMessage = "Cập nhật cài đặt survey: {$survey->title}";
            if (!empty($changes)) {
                $logMessage .= " | Thay đổi: " . implode(', ', $changes);
            }
            
            // Ghi audit log
            $this->auditLogService->log(
                $id,
                'update',
                'survey',
                $id,
                $logMessage
            );
            
            return $survey;
        } catch (\Exception $e) {
            Log::error('Error updating survey: ' . $e->getMessage());
            throw new \Exception('Không thể cập nhật survey: ' . $e->getMessage());
        }
    }

    /**
     * Lấy survey cho participant
     */
    public function getSurveyForParticipant($id)
    {
        try {
            return $this->surveyRepository->findForParticipant($id);
        } catch (\Exception $e) {
            Log::error('Error getting survey for participant: ' . $e->getMessage());
            throw new \Exception('Survey không tồn tại hoặc chưa được kích hoạt');
        }
    }
}
