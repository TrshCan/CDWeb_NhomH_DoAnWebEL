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

class SurveyService
{
    protected $repository;

    public function __construct(SurveyRepository $repository)
    {
        $this->repository = $repository;
    }

    public function createSurvey(array $data): Survey
    {
        // Gán giá trị mặc định theo schema
        $data = array_merge([
            'type' => 'survey',
            'object' => 'public',
            'points' => 0,
            'status' => 'active', // Giá trị mặc định cho status
        ], $data);

        // Validation với thông báo lỗi tiếng Việt
        $validator = Validator::make($data, [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'categories_id' => 'required|integer|exists:categories,id',
            'type' => 'sometimes|in:survey,quiz',
            'start_at' => 'nullable|date',
            'end_at' => 'nullable|date|after_or_equal:start_at',
            'time_limit' => 'nullable|integer|min:0',
            'points' => 'sometimes|integer|min:0',
            'object' => 'sometimes|in:public,students,lecturers',
            'created_by' => 'required|exists:users,id',
            'status' => 'sometimes|in:paused,active,closed', // Validation cho status
        ], [
            'title.required' => 'Tiêu đề là bắt buộc.',
            'title.string' => 'Tiêu đề phải là chuỗi ký tự.',
            'title.max' => 'Tiêu đề không được vượt quá 255 ký tự.',
            'categories_id.required' => 'Danh mục là bắt buộc.',
            'categories_id.exists' => 'Danh mục không tồn tại.',
            'created_by.required' => 'Người tạo là bắt buộc.',
            'created_by.exists' => 'Người tạo không tồn tại.',
            'type.in' => 'Loại khảo sát phải là "survey" hoặc "quiz".',
            'end_at.after_or_equal' => 'Ngày kết thúc phải sau hoặc bằng ngày bắt đầu.',
            'time_limit.min' => 'Thời gian giới hạn phải lớn hơn hoặc bằng 0.',
            'points.min' => 'Điểm phải lớn hơn hoặc bằng 0.',
            'object.in' => 'Đối tượng phải là "public", "students" hoặc "lecturers".',
            'status.in' => 'Trạng thái phải là "paused", "active" hoặc "closed".',
        ]);

        if ($validator->fails()) {
            throw new ValidationException($validator);
        }

        try {
            DB::beginTransaction();
            $survey = $this->repository->create($data);
            DB::commit();
            return $survey;
        } catch (ModelNotFoundException $e) {
            DB::rollBack();
            Log::error('Error creating survey: ' . $e->getMessage(), ['data' => $data]);
            throw new Exception('Danh mục hoặc người dùng không tồn tại.', 404, $e);
        } catch (Exception $e) {
            DB::rollBack();
            Log::error('Error creating survey: ' . $e->getMessage(), ['data' => $data]);
            throw new Exception('Không thể tạo khảo sát.', 500, $e);
        }
    }

    public function deleteSurvey(int $id): bool
    {
        try {
            DB::beginTransaction();
            // Tìm khảo sát
            $survey = $this->repository->findById($id);
            if (!$survey) {
                throw new ModelNotFoundException("Không tìm thấy khảo sát có ID {$id}");
            }
            // Xóa mềm (Soft Delete)
            $survey->delete();
            DB::commit();
            return true;
        } catch (ModelNotFoundException $e) {
            DB::rollBack();
            Log::warning("Xóa khảo sát thất bại: không tìm thấy ID {$id}");
            throw new Exception("Không tìm thấy khảo sát để xóa.", 404);
        } catch (Exception $e) {
            DB::rollBack();
            Log::error('Error deleting survey: ' . $e->getMessage(), ['id' => $id]);
            throw new Exception('Không thể xóa khảo sát.', 500, $e);
        }
    }

    public function updateSurvey(int $id, array $data): Survey
    {
        // Validation cho cập nhật
        $validator = Validator::make($data, [
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'categories_id' => 'sometimes|integer|exists:categories,id',
            'type' => 'sometimes|in:survey,quiz',
            'start_at' => 'nullable|date',
            'end_at' => 'nullable|date|after_or_equal:start_at',
            'time_limit' => 'nullable|integer|min:0',
            'points' => 'sometimes|integer|min:0',
            'object' => 'sometimes|in:public,students,lecturers',
            'status' => 'sometimes|in:paused,active,closed', // Validation cho status
        ], [
            'title.string' => 'Tiêu đề phải là chuỗi ký tự.',
            'title.max' => 'Tiêu đề không được vượt quá 255 ký tự.',
            'categories_id.exists' => 'Danh mục không tồn tại.',
            'type.in' => 'Loại khảo sát phải là "survey" hoặc "quiz".',
            'end_at.after_or_equal' => 'Ngày kết thúc phải sau hoặc bằng ngày bắt đầu.',
            'time_limit.min' => 'Thời gian giới hạn phải lớn hơn hoặc bằng 0.',
            'points.min' => 'Điểm phải lớn hơn hoặc bằng 0.',
            'object.in' => 'Đối tượng phải là "public", "students" hoặc "lecturers".',
            'status.in' => 'Trạng thái phải là "paused", "active" hoặc "closed".',
        ]);

        if ($validator->fails()) {
            throw new ValidationException($validator);
        }

        try {
            DB::beginTransaction();
            $survey = $this->repository->findById($id);
            if (!$survey) {
                throw new ModelNotFoundException("Không tìm thấy khảo sát có ID {$id}");
            }
            $updatedSurvey = $this->repository->update($survey, $data);
            DB::commit();
            return $updatedSurvey;
        } catch (ModelNotFoundException $e) {
            DB::rollBack();
            Log::warning("Cập nhật khảo sát thất bại: không tìm thấy ID {$id}");
            throw new Exception("Không tìm thấy khảo sát để cập nhật.", 404);
        } catch (Exception $e) {
            DB::rollBack();
            Log::error('Error updating survey: ' . $e->getMessage(), ['id' => $id, 'data' => $data]);
            throw new Exception('Không thể cập nhật khảo sát.', 500, $e);
        }
    }

    public function getSurveyById(int $id): Survey
    {
        try {
            $survey = $this->repository->findById($id);
            if (!$survey) {
                throw new ModelNotFoundException("Không tìm thấy khảo sát có ID {$id}");
            }
            return $survey;
        } catch (ModelNotFoundException $e) {
            Log::warning("Xem chi tiết khảo sát thất bại: không tìm thấy ID {$id}");
            throw new Exception("Không tìm thấy khảo sát.", 404);
        } catch (Exception $e) {
            Log::error('Error fetching survey detail: ' . $e->getMessage(), ['id' => $id]);
            throw new Exception('Không thể tải chi tiết khảo sát.', 500, $e);
        }
    }

    public function getAllSurveys(int $perPage = 10)
    {
        try {
            return $this->repository->getAllPaginated($perPage);
        } catch (Exception $e) {
            Log::error('Error fetching surveys: ' . $e->getMessage());
            throw new Exception('Không thể tải danh sách khảo sát.', 500, $e);
        }
    }
}