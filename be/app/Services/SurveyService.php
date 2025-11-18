<?php

namespace App\Services;

use App\Models\Survey;
use App\Repositories\SurveyRepository;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Exception;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class SurveyService
{
    protected $repository;

    public function __construct(SurveyRepository $repository)
    {
        $this->repository = $repository;
    }

    /**
     * TẠO KHẢO SÁT – CHỈ XỬ LÝ METADATA
     */
    public function createSurvey(array $data): Survey
    {
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

        // === KIỂM TRA TRÙNG TIÊU ĐỀ CỦA CÙNG NGƯỜI TẠO ===
        if (!empty($data['title']) && !empty($data['created_by'])) {
            $exists = Survey::where('title', $data['title'])
                ->where('created_by', $data['created_by'])
                ->whereNull('deleted_at')
                ->exists();

            if ($exists) {
                $validator = Validator::make([], []);
                throw new ValidationException($validator, response()->json([
                    'errors' => ['title' => ['Tiêu đề khảo sát đã tồn tại. Vui lòng chọn tiêu đề khác.']]
                ], 422));
            }
        }

        // === VALIDATION TIẾNG VIỆT ===
        $rules = [
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'categories_id' => 'required|integer|exists:categories,id',
            'type' => 'required|in:survey,quiz',
            'start_at' => 'required|date_format:Y-m-d H:i:s|after_or_equal:now',
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
            'start_at.after_or_equal' => 'Thời gian bắt đầu phải lớn hơn hoặc bằng thời điểm hiện tại.',
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

        try {
            DB::beginTransaction();
            $survey = $this->repository->create($data);
            DB::commit();

            // Load lại survey với creator_name
            $surveyWithCreator = $this->repository->findWithCreatorNameAfterSave($survey->id);
            
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
    }

    /**
     * XÓA KHẢO SÁT – SOFT DELETE
     */
    public function deleteSurvey(int $id): bool
    {
        try {
            DB::beginTransaction();

            $survey = $this->repository->findById($id);
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
    public function updateSurvey(int $id, array $data): Survey
    {
        $survey = $this->repository->findById($id);
        if (!$survey) {
            throw new Exception('Khảo sát không tồn tại hoặc đã bị xóa.', 404);
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
            'description' => 'sometimes|required|string',
            'categories_id' => 'sometimes|integer|exists:categories,id',
            'type' => 'sometimes|in:survey,quiz',
            'start_at' => 'sometimes|required|date_format:Y-m-d H:i:s|after_or_equal:now',
            'end_at' => 'sometimes|required|date_format:Y-m-d H:i:s|after:start_at',
            'time_limit' => 'nullable|integer|min:1',
            'points' => $pointsRule,
            'object' => 'sometimes|in:public,students,lecturers',
            'status' => 'sometimes|in:pending,active,paused,closed',
        ], [
            'description.required' => 'Mô tả khảo sát không được để trống.',
            'start_at.after_or_equal' => 'Thời gian bắt đầu phải lớn hơn hoặc bằng thời điểm hiện tại.',
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

        try {
            DB::beginTransaction();
            $updatedSurvey = $this->repository->update($survey, $data);
            DB::commit();

            // Load lại survey với creator_name
            $surveyWithCreator = $this->repository->findWithCreatorNameAfterSave($updatedSurvey->id);
            
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
    public function getSurveyById(int $id): Survey
    {
        try {
            $survey = $this->repository->findWithCreatorName($id);
            if (!$survey) {
                throw new ModelNotFoundException("Khảo sát ID {$id} không tồn tại.");
            }
            return $survey;
        } catch (ModelNotFoundException $e) {
            Log::warning('Không tìm thấy khảo sát', ['id' => $id]);
            throw new Exception('Khảo sát không tồn tại hoặc đã bị xóa.', 404);
        } catch (\Exception $e) {
            Log::error('Lỗi tải chi tiết khảo sát', ['id' => $id, 'error' => $e->getMessage()]);
            throw new Exception('Không thể tải chi tiết.', 500);
        }
    }

    /**
     * LẤY DANH SÁCH (có filter)
     */
    public function getAllSurveys(int $perPage = 10, array $filters = [])
    {
        try {
            return $this->repository->getAllPaginated($perPage, $filters);
        } catch (\Exception $e) {
            Log::error('Lỗi tải danh sách khảo sát', ['error' => $e->getMessage()]);
            throw new Exception('Không thể tải danh sách khảo sát.', 500);
        }
    }
}