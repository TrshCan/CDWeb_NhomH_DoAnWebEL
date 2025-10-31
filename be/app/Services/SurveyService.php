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

    /**
     * TẠO KHẢO SÁT – BẮT TẤT CẢ LỖI
     */
    public function createSurvey(array $data): Survey
    {
        // GÁN MẶC ĐỊNH
        $data = array_merge([
            'type' => 'survey',
            'object' => 'public',
            'points' => 0,
            'status' => 'active',
        ], $data);

        // VALIDATION TIẾNG VIỆT
        $validator = Validator::make($data, [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'categories_id' => 'required|integer|exists:categories,id',
            'type' => 'sometimes|in:survey,quiz',
            'start_at' => 'nullable|date_format:Y-m-d H:i:s',
            'end_at' => 'nullable|date_format:Y-m-d H:i:s|after_or_equal:start_at',
            'time_limit' => 'nullable|integer|min:0',
            'points' => 'sometimes|integer|min:0',
            'object' => 'sometimes|in:public,students,lecturers',
            'created_by' => 'required|integer|exists:users,id',
            'status' => 'sometimes|in:paused,active,closed',
        ], [
            'title.required' => 'Tiêu đề là bắt buộc.',
            'title.max' => 'Tiêu đề không được quá 255 ký tự.',
            'categories_id.required' => 'Vui lòng chọn danh mục.',
            'categories_id.exists' => 'Danh mục không tồn tại.',
            'created_by.required' => 'Người tạo là bắt buộc.',
            'created_by.exists' => 'Người dùng không tồn tại.',
            'type.in' => 'Loại phải là "survey" hoặc "quiz".',
            'start_at.date_format' => 'Ngày bắt đầu phải đúng định dạng (YYYY-MM-DD HH:MM:SS).',
            'end_at.date_format' => 'Ngày kết thúc phải đúng định dạng (YYYY-MM-DD HH:MM:SS).',
            'end_at.after_or_equal' => 'Ngày kết thúc phải sau hoặc bằng ngày bắt đầu.',
            'status.in' => 'Trạng thái phải là "paused", "active" hoặc "closed".',
        ]);

        if ($validator->fails()) {
            throw new ValidationException($validator);
        }

        try {
            DB::beginTransaction();
            $survey = $this->repository->create($data);
            DB::commit();

            Log::info('Tạo khảo sát thành công', ['id' => $survey->id, 'title' => $survey->title]);
            return $survey;
        } catch (\Exception $e) {
            DB::rollBack();

            // BẮT LỖI CỤ THỂ
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

            $survey->delete(); // Soft delete
            DB::commit();

            Log::info('Xóa khảo sát thành công (soft delete)', ['id' => $id]);
            return true;
        } catch (ModelNotFoundException $e) {
            DB::rollBack();
            Log::warning('Không tìm thấy khảo sát để xóa', ['id' => $id]);
            throw new Exception('Không tìm thấy khảo sát để xóa.', 404);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Lỗi xóa khảo sát', ['id' => $id, 'error' => $e->getMessage()]);
            throw new Exception('Không thể xóa khảo sát.', 500);
        }
    }

    /**
     * CẬP NHẬT KHẢO SÁT
     */
    public function updateSurvey(int $id, array $data): Survey
    {
        $validator = Validator::make($data, [
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'categories_id' => 'sometimes|integer|exists:categories,id',
            'type' => 'sometimes|in:survey,quiz',
            'start_at' => 'nullable|date_format:Y-m-d H:i:s',
            'end_at' => 'nullable|date_format:Y-m-d H:i:s|after_or_equal:start_at',
            'time_limit' => 'nullable|integer|min:0',
            'points' => 'sometimes|integer|min:0',
            'object' => 'sometimes|in:public,students,lecturers',
            'status' => 'sometimes|in:paused,active,closed',
        ], [
            'title.max' => 'Tiêu đề không được quá 255 ký tự.',
            'categories_id.exists' => 'Danh mục không tồn tại.',
            'type.in' => 'Loại phải là "survey" hoặc "quiz".',
            'start_at.date_format' => 'Ngày bắt đầu không đúng định dạng.',
            'end_at.after_or_equal' => 'Ngày kết thúc phải sau hoặc bằng ngày bắt đầu.',
            'status.in' => 'Trạng thái không hợp lệ.',
        ]);

        if ($validator->fails()) {
            throw new ValidationException($validator);
        }

        try {
            DB::beginTransaction();

            $survey = $this->repository->findById($id);
            if (!$survey) {
                throw new ModelNotFoundException("Khảo sát ID {$id} không tồn tại.");
            }

            $updatedSurvey = $this->repository->update($survey, $data);
            DB::commit();

            Log::info('Cập nhật khảo sát thành công', ['id' => $id, 'title' => $updatedSurvey->title]);
            return $updatedSurvey;
        } catch (ModelNotFoundException $e) {
            DB::rollBack();
            throw new Exception('Không tìm thấy khảo sát để cập nhật.', 404);
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
            $survey = $this->repository->findById($id);
            if (!$survey) {
                throw new ModelNotFoundException("Khảo sát ID {$id} không tồn tại.");
            }
            return $survey;
        } catch (ModelNotFoundException $e) {
            Log::warning('Không tìm thấy khảo sát', ['id' => $id]);
            throw new Exception('Không tìm thấy khảo sát.', 404);
        } catch (\Exception $e) {
            Log::error('Lỗi tải chi tiết khảo sát', ['id' => $id, 'error' => $e->getMessage()]);
            throw new Exception('Không thể tải chi tiết.', 500);
        }
    }

    /**
     * LẤY DANH SÁCH
     */
    public function getAllSurveys(int $perPage = 10)
    {
        try {
            return $this->repository->getAllPaginated($perPage);
        } catch (\Exception $e) {
            Log::error('Lỗi tải danh sách khảo sát', ['error' => $e->getMessage()]);
            throw new Exception('Không thể tải danh sách khảo sát.', 500);
        }
    }
}