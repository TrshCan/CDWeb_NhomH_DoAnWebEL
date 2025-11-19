<?php

namespace App\Services;

use App\Repositories\DeadlineRepository;
use App\Models\Deadline;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Database\QueryException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Exception;
use Carbon\Carbon;

class DeadlineService
{
    protected DeadlineRepository $repository;

    public function __construct(DeadlineRepository $repository)
    {
        $this->repository = $repository;
    }

    public function createDeadline(array $data): Deadline
    {
        try {
            // Validation rules
            $validator = Validator::make($data, [
                'title' => [
                    'required',
                    'string',
                    'max:255',
                    'regex:/^[a-zA-Z0-9\sÀ-ỹ.,-]*$/',
                ],
                'deadline_date' => [
                    'required',
                    'date',
                    'date_format:Y-m-d H:i:s',
                    'after:now',
                ],
                'details' => [
                    'nullable',
                    'string',
                    'max:255',
                    'regex:/^[a-zA-Z0-9\sÀ-ỹ.,-]*$/',
                ],
            ], [
                'title.required' => 'Tên deadline không được để trống.',
                'title.max' => 'Tên deadline không được vượt quá 255 ký tự.',
                'title.regex' => 'Tên deadline chứa ký tự không hợp lệ.',
                'deadline_date.required' => 'Ngày giờ kết thúc không được để trống.',
                'deadline_date.date_format' => 'Ngày giờ kết thúc không hợp lệ. Định dạng: YYYY-MM-DD HH:mm:ss.',
                'deadline_date.after' => 'Ngày giờ kết thúc phải sau thời điểm hiện tại.',
                'details.max' => 'Ghi chú không được vượt quá 255 ký tự.',
                'details.regex' => 'Ghi chú chứa ký tự không hợp lệ.',
            ]);

            if ($validator->fails()) {
                throw new ValidationException($validator);
            }

            // Kiểm tra xung đột
            if ($this->repository->checkConflict($data['title'], $data['deadline_date'])) {
                throw new Exception("Đã tồn tại deadline khác vào cùng thời điểm hoặc cùng tiêu đề.");
            }

            // Set created_by và created_at (giả lập user ID = 1 nếu không có Auth)
            $data['created_by'] = 1; // Giả lập user ID
            $data['created_at'] = now();

            // Thực hiện tạo deadline trong transaction
            return DB::transaction(function () use ($data) {
                try {
                    return $this->repository->create($data);
                } catch (QueryException $e) {
                    throw new Exception("Không thể lưu dữ liệu. Vui lòng thử lại sau.");
                }
            });
        } catch (ValidationException $e) {
            // Re-throw validation exceptions để resolver xử lý
            throw $e;
        } catch (QueryException $e) {
            // Xử lý lỗi hệ thống hoặc kết nối DB
            if (strpos($e->getMessage(), 'SQLSTATE[HY000]') !== false) {
                throw new Exception("Không thể kết nối đến cơ sở dữ liệu.");
            }
            if (strpos($e->getMessage(), 'SQLSTATE[HY000]: General error: 1205') !== false) {
                throw new Exception("Truy vấn quá lâu, hệ thống đã hủy yêu cầu.");
            }
            throw new Exception("Đã xảy ra lỗi không xác định. Vui lòng liên hệ quản trị viên.");
        } catch (Exception $e) {
            // Ném lại các lỗi khác (xung đột, etc.)
            throw $e;
        }
    }

    public function updateDeadline(int $id, array $data): Deadline
    {
        try {
            $deadline = $this->repository->findById($id);
            if (!$deadline) {
                throw new Exception("Không tìm thấy deadline hoặc deadline đã bị xóa.");
            }

            // Validation rules
            $validator = Validator::make($data, [
                'title' => [
                    'sometimes',
                    'required',
                    'string',
                    'max:255',
                    'regex:/^[a-zA-Z0-9\sÀ-ỹ.,-]*$/',
                ],
                'deadline_date' => [
                    'sometimes',
                    'required',
                    'date',
                    'date_format:Y-m-d H:i:s',
                    'after:now',
                ],
                'details' => [
                    'nullable',
                    'string',
                    'max:255',
                    'regex:/^[a-zA-Z0-9\sÀ-ỹ.,-]*$/',
                ],
            ], [
                'title.required' => 'Tên deadline không được để trống.',
                'title.max' => 'Tên deadline không được vượt quá 255 ký tự.',
                'title.regex' => 'Tên deadline chứa ký tự không hợp lệ.',
                'deadline_date.required' => 'Ngày giờ kết thúc không được để trống.',
                'deadline_date.date_format' => 'Ngày giờ kết thúc không hợp lệ. Định dạng: YYYY-MM-DD HH:mm:ss.',
                'deadline_date.after' => 'Ngày giờ kết thúc phải sau thời điểm hiện tại.',
                'details.max' => 'Ghi chú không được vượt quá 255 ký tự.',
                'details.regex' => 'Ghi chú chứa ký tự không hợp lệ.',
            ]);

            if ($validator->fails()) {
                throw new ValidationException($validator);
            }

            // Kiểm tra xung đột
            $titleToCheck = $data['title'] ?? $deadline->title;
            $deadlineDateToCheck = $data['deadline_date'] ?? null;
            
            // Chuyển đổi deadline_date từ Carbon sang string nếu cần
            if ($deadlineDateToCheck === null) {
                $deadlineDateToCheck = $deadline->deadline_date instanceof Carbon 
                    ? $deadline->deadline_date->format('Y-m-d H:i:s') 
                    : (string)$deadline->deadline_date;
            }
            
            if ($this->repository->checkConflict($titleToCheck, $deadlineDateToCheck, $id)) {
                throw new Exception("Xung đột với deadline khác. Vui lòng chọn thời điểm hoặc tiêu đề khác.");
            }

            // Thực hiện cập nhật trong transaction
            return DB::transaction(function () use ($id, $data) {
                try {
                    return $this->repository->update($id, $data);
                } catch (QueryException $e) {
                    throw new Exception("Không thể lưu dữ liệu. Vui lòng thử lại sau.");
                }
            });
        } catch (ValidationException $e) {
            // Re-throw validation exceptions để resolver xử lý
            throw $e;
        } catch (ModelNotFoundException $e) {
            throw new Exception("Không tìm thấy deadline hoặc deadline đã bị xóa.");
        } catch (QueryException $e) {
            // Xử lý lỗi hệ thống hoặc kết nối DB
            if (strpos($e->getMessage(), 'SQLSTATE[HY000]') !== false) {
                throw new Exception("Không thể kết nối đến cơ sở dữ liệu.");
            }
            if (strpos($e->getMessage(), 'SQLSTATE[HY000]: General error: 1205') !== false) {
                throw new Exception("Truy vấn quá lâu, hệ thống đã hủy yêu cầu.");
            }
            throw new Exception("Đã xảy ra lỗi không xác định. Vui lòng liên hệ quản trị viên.");
        } catch (Exception $e) {
            // Xử lý các lỗi khác
            throw $e;
        }
    }

    public function deleteDeadline(int $id): bool
    {
        try {
            $deadline = $this->repository->findById($id);
            if (!$deadline) {
                throw new Exception("Không tìm thấy deadline ID: $id");
            }

            return DB::transaction(function () use ($id) {
                try {
                    return $this->repository->softDelete($id);
                } catch (QueryException $e) {
                    throw new Exception("Không thể xóa deadline. Vui lòng thử lại sau.");
                }
            });
        } catch (Exception $e) {
            if ($e instanceof QueryException) {
                if (strpos($e->getMessage(), 'SQLSTATE[HY000]') !== false) {
                    throw new Exception("Không thể kết nối đến cơ sở dữ liệu.");
                }
                throw new Exception("Đã xảy ra lỗi không xác định. Vui lòng liên hệ quản trị viên.");
            }
            throw $e;
        }
    }

    public function restoreDeadline(int $id): bool
    {
        try {
            $deadline = $this->repository->findDeletedById($id);
            if (!$deadline) {
                throw new Exception("Không tìm thấy deadline đã xóa.");
            }

            // Kiểm tra xung đột - chuyển đổi deadline_date từ Carbon sang string
            $deadlineDateStr = $deadline->deadline_date instanceof Carbon 
                ? $deadline->deadline_date->format('Y-m-d H:i:s') 
                : (string)$deadline->deadline_date;
            
            if ($this->repository->checkConflict($deadline->title, $deadlineDateStr)) {
                throw new Exception("Không thể khôi phục deadline. Kiểm tra dữ liệu hoặc xung đột với deadline khác.");
            }

            return DB::transaction(function () use ($id) {
                try {
                    return $this->repository->restore($id);
                } catch (QueryException $e) {
                    throw new Exception("Không thể khôi phục deadline. Vui lòng thử lại sau.");
                }
            });
        } catch (Exception $e) {
            if ($e instanceof QueryException) {
                if (strpos($e->getMessage(), 'SQLSTATE[HY000]') !== false) {
                    throw new Exception("Không thể kết nối đến cơ sở dữ liệu.");
                }
                throw new Exception("Đã xảy ra lỗi không xác định. Vui lòng liên hệ quản trị viên.");
            }
            throw $e;
        }
    }

    public function getPaginatedDeadlines(int $perPage = 5, int $page = 1, bool $includeDeleted = false)
    {
        try {
            $paginator = $this->repository->getAllPaginated(null, null, null, $includeDeleted, $perPage, $page);
            $items = $paginator->items();

            // Kiểm tra định dạng dữ liệu trả về
            if (!is_array($items)) {
                throw new Exception("Dữ liệu phản hồi không hợp lệ.");
            }

            return [
                'data' => $items,
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'total' => $paginator->total(),
            ];
        } catch (Exception $e) {
            if ($e instanceof QueryException) {
                if (strpos($e->getMessage(), 'SQLSTATE[HY000]') !== false) {
                    throw new Exception("Không thể kết nối đến cơ sở dữ liệu.");
                }
                if (strpos($e->getMessage(), 'SQLSTATE[HY000]: General error: 1205') !== false) {
                    throw new Exception("Truy vấn quá lâu, hệ thống đã hủy yêu cầu.");
                }
                throw new Exception("Đã xảy ra lỗi không xác định. Vui lòng liên hệ quản trị viên.");
            }
            throw $e;
        }
    }

    public function searchDeadlines(array $filters = [], int $perPage = 5, int $page = 1)
    {
        try {
            $title = $filters['title'] ?? null;
            $deadline_date = $filters['deadline_date'] ?? null;
            $details = $filters['details'] ?? null;
            $includeDeleted = $filters['include_deleted'] ?? false;

            // Validation cho filters
            $validator = Validator::make($filters, [
                'title' => 'nullable|string|max:255',
                'deadline_date' => 'nullable|date_format:Y-m-d H:i:s',
                'details' => 'nullable|string|max:255',
            ], [
                'title.max' => 'Tên deadline tìm kiếm không được vượt quá 255 ký tự.',
                'deadline_date.date_format' => 'Ngày giờ kết thúc tìm kiếm không hợp lệ. Định dạng: YYYY-MM-DD HH:mm:ss.',
                'details.max' => 'Ghi chú tìm kiếm không được vượt quá 255 ký tự.',
            ]);

            if ($validator->fails()) {
                throw new ValidationException($validator);
            }

            $paginator = $this->repository->getAllPaginated($title, $deadline_date, $details, $includeDeleted, $perPage, $page);
            $items = $paginator->items();

            // Kiểm tra định dạng dữ liệu trả về
            if (!is_array($items)) {
                throw new Exception("Dữ liệu phản hồi không hợp lệ.");
            }

            return [
                'data' => $items,
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'total' => $paginator->total(),
            ];
        } catch (Exception $e) {
            if ($e instanceof QueryException) {
                if (strpos($e->getMessage(), 'SQLSTATE[HY000]') !== false) {
                    throw new Exception("Không thể kết nối đến cơ sở dữ liệu.");
                }
                if (strpos($e->getMessage(), 'SQLSTATE[HY000]: General error: 1205') !== false) {
                    throw new Exception("Truy vấn quá lâu, hệ thống đã hủy yêu cầu.");
                }
                throw new Exception("Đã xảy ra lỗi không xác định. Vui lòng liên hệ quản trị viên.");
            }
            throw $e;
        }
    }

    public function getDeadlineById(int $id)
    {
        try {
            $deadline = $this->repository->findById($id);
            if (!$deadline) {
                throw new Exception("Không tìm thấy deadline hoặc deadline đã bị xóa.");
            }
            return $deadline;
        } catch (Exception $e) {
            if ($e instanceof QueryException) {
                if (strpos($e->getMessage(), 'SQLSTATE[HY000]') !== false) {
                    throw new Exception("Không thể kết nối đến cơ sở dữ liệu.");
                }
                throw new Exception("Đã xảy ra lỗi không xác định. Vui lòng liên hệ quản trị viên.");
            }
            throw $e;
        }
    }

    public function upcoming()
    {
        return $this->repository->upcoming();
    }
}