<?php

namespace App\Services;

use App\Repositories\DeadlineRepository;
use App\Models\Deadline;
use App\Helpers\ValidationHelper;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
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

    public function createDeadline(array $data, ?int $userId = null): Deadline
    {
        // Prevent duplicate submissions using cache lock
        $lockKey = 'deadline_create_' . md5(json_encode($data) . ($userId ?? 0));
        $lock = Cache::lock($lockKey, 5); // 5 seconds lock

        if (!$lock->get()) {
            throw new Exception("Đang xử lý yêu cầu. Vui lòng đợi và thử lại.");
        }

        try {
            // Sanitize và validate title
            $data['title'] = ValidationHelper::sanitizeTitle($data['title'] ?? '');

            // Sanitize details
            if (isset($data['details']) && !empty($data['details'])) {
                $data['details'] = ValidationHelper::sanitizeDetails($data['details'], 255);
            } else {
                $data['details'] = null;
            }

            // Normalize và validate deadline_date format
            if (isset($data['deadline_date'])) {
                try {
                    $date = Carbon::parse($data['deadline_date']);
                    $data['deadline_date'] = $date->format('Y-m-d H:i:s');
                    
                    // Check if deadline is in the future
                    if ($date->lte(Carbon::now())) {
                        throw new Exception("Ngày giờ kết thúc phải sau thời điểm hiện tại.");
                    }
                } catch (\Exception $e) {
                    if (strpos($e->getMessage(), 'Ngày giờ kết thúc') !== false) {
                        throw $e;
                    }
                    throw new Exception("Định dạng ngày tháng không hợp lệ. Định dạng yêu cầu: YYYY-MM-DD HH:mm:ss.");
                }
            }

            $validator = Validator::make($data, [
                'title' => 'required|string|max:255',
                'deadline_date' => ['required', 'date', 'date_format:Y-m-d H:i:s', 'after:now'],
                'details' => 'nullable|string|max:255',
            ], [
                'title.required' => 'Tên deadline không được để trống.',
                'title.max' => 'Tên deadline không được vượt quá 255 ký tự.',
                'deadline_date.required' => 'Ngày giờ kết thúc không được để trống.',
                'deadline_date.date_format' => 'Ngày giờ kết thúc không hợp lệ. Định dạng: YYYY-MM-DD HH:mm:ss.',
                'deadline_date.after' => 'Ngày giờ kết thúc phải sau thời điểm hiện tại.',
                'details.max' => 'Ghi chú không được vượt quá 255 ký tự.',
            ]);

            if ($validator->fails()) {
                throw new ValidationException($validator);
            }

            // Kiểm tra xung đột
            if ($this->repository->checkConflict($data['title'], $data['deadline_date'])) {
                $validator = Validator::make([], []);
                $validator->errors()->add('title', 'Đã tồn tại deadline khác vào cùng thời điểm hoặc cùng tiêu đề.');
                throw new ValidationException($validator);
            }

            // Set created_by và created_at
            $data['created_by'] = $userId ?? 1;
            $data['created_at'] = Carbon::now()->toDateTimeString();
            $data['updated_at'] = Carbon::now()->toDateTimeString(); // Set updated_at khi tạo mới

            // Thực hiện tạo deadline trong transaction
            return DB::transaction(function () use ($data) {
                try {
                    return $this->repository->create($data);
                } catch (QueryException $e) {
                    // Log chi tiết lỗi để debug
                    \Log::error('DeadlineService createDeadline QueryException:', [
                        'message' => $e->getMessage(),
                        'code' => $e->getCode(),
                        'sql' => $e->getSql() ?? null,
                        'bindings' => $e->getBindings() ?? null,
                    ]);
                    
                    // Phân tích lỗi cụ thể
                    $errorMsg = $e->getMessage();
                    if (strpos($errorMsg, 'Duplicate entry') !== false) {
                        throw new Exception("Deadline này đã tồn tại. Vui lòng kiểm tra lại tiêu đề hoặc ngày giờ.");
                    } elseif (strpos($errorMsg, 'Unknown column') !== false) {
                        throw new Exception("Lỗi cấu trúc dữ liệu. Vui lòng liên hệ quản trị viên.");
                    } elseif (strpos($errorMsg, 'SQLSTATE[HY000]') !== false) {
                        throw new Exception("Không thể kết nối đến cơ sở dữ liệu. Vui lòng thử lại sau.");
                    } else {
                        throw new Exception("Không thể tạo deadline. " . $errorMsg);
                    }
                }
            });
        } catch (ValidationException $e) {
            throw $e;
        } catch (QueryException $e) {
            if (strpos($e->getMessage(), 'SQLSTATE[HY000]') !== false) {
                throw new Exception("Không thể kết nối đến cơ sở dữ liệu.");
            }
            if (strpos($e->getMessage(), 'SQLSTATE[HY000]: General error: 1205') !== false) {
                throw new Exception("Truy vấn quá lâu, hệ thống đã hủy yêu cầu.");
            }
            throw new Exception("Đã xảy ra lỗi không xác định. Vui lòng liên hệ quản trị viên.");
        } catch (Exception $e) {
            throw $e;
        } finally {
            $lock->release();
        }
    }

    public function updateDeadline(int $id, array $data, ?string $updatedAt = null): Deadline
    {
        // Validate ID
        $id = ValidationHelper::validateId($id);

        // Lock để tránh concurrent updates
        $lockKey = 'deadline_update_' . $id;
        $lock = Cache::lock($lockKey, 10); // 10 seconds lock

        if (!$lock->get()) {
            throw new Exception("Đang xử lý yêu cầu cập nhật. Vui lòng đợi và thử lại.");
        }

        try {
            $deadline = $this->repository->findById($id);
            if (!$deadline) {
                throw new Exception("Không tìm thấy deadline hoặc deadline đã bị xóa.");
            }

            // Optimistic locking: Kiểm tra nếu có updated_at và không khớp
            if ($updatedAt) {
                // Lấy updated_at hiện tại, nếu không có thì dùng created_at (cho records cũ)
                $currentUpdatedAt = null;
                if ($deadline->updated_at) {
                    $currentUpdatedAt = is_string($deadline->updated_at)
                        ? Carbon::parse($deadline->updated_at)->toDateTimeString()
                        : $deadline->updated_at->toDateTimeString();
                } elseif ($deadline->created_at) {
                    // Fallback cho records cũ chưa có updated_at
                    $currentUpdatedAt = is_string($deadline->created_at)
                        ? Carbon::parse($deadline->created_at)->toDateTimeString()
                        : $deadline->created_at->toDateTimeString();
                }
                
                if ($currentUpdatedAt && $currentUpdatedAt !== $updatedAt) {
                    throw new Exception("Dữ liệu đã được cập nhật bởi người khác. Vui lòng tải lại trang trước khi cập nhật.");
                }
            }

            // Sanitize và validate title nếu có
            if (isset($data['title'])) {
                $data['title'] = ValidationHelper::sanitizeTitle($data['title']);
            }

            // Sanitize details nếu có
            if (isset($data['details'])) {
                if (!empty($data['details'])) {
                    $data['details'] = ValidationHelper::sanitizeDetails($data['details'], 255);
                } else {
                    $data['details'] = null;
                }
            }

            // Normalize và validate deadline_date format if provided
            if (isset($data['deadline_date'])) {
                try {
                    $date = Carbon::parse($data['deadline_date']);
                    $data['deadline_date'] = $date->format('Y-m-d H:i:s');
                    
                    // Check if deadline is in the future
                    if ($date->lte(Carbon::now())) {
                        throw new Exception("Ngày giờ kết thúc phải sau thời điểm hiện tại.");
                    }
                } catch (\Exception $e) {
                    if (strpos($e->getMessage(), 'Ngày giờ kết thúc') !== false) {
                        throw $e;
                    }
                    throw new Exception("Định dạng ngày tháng không hợp lệ. Định dạng yêu cầu: YYYY-MM-DD HH:mm:ss.");
                }
            }

            $validator = Validator::make($data, [
                'title' => 'sometimes|required|string|max:255',
                'deadline_date' => 'sometimes|required|date_format:Y-m-d H:i:s|after:now',
                'details' => 'nullable|string|max:255',
            ], [
                'title.required' => 'Tên deadline không được để trống.',
                'title.max' => 'Tên deadline không được vượt quá 255 ký tự.',
                'deadline_date.required' => 'Ngày giờ kết thúc không được để trống.',
                'deadline_date.date_format' => 'Ngày giờ kết thúc không hợp lệ. Định dạng: YYYY-MM-DD HH:mm:ss.',
                'deadline_date.after' => 'Ngày giờ kết thúc phải sau thời điểm hiện tại.',
                'details.max' => 'Ghi chú không được vượt quá 255 ký tự.',
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
                $validator = Validator::make([], []);
                $validator->errors()->add('title', 'Xung đột với deadline khác. Vui lòng chọn thời điểm hoặc tiêu đề khác.');
                throw new ValidationException($validator);
            }

            // Thực hiện cập nhật trong transaction
            return DB::transaction(function () use ($id, $data) {
                try {
                    // Set updated_at khi update
                    $data['updated_at'] = Carbon::now()->toDateTimeString();
                    return $this->repository->update($id, $data);
                } catch (QueryException $e) {
                    // Log chi tiết lỗi để debug
                    \Log::error('DeadlineService updateDeadline QueryException:', [
                        'message' => $e->getMessage(),
                        'code' => $e->getCode(),
                        'sql' => $e->getSql() ?? null,
                        'bindings' => $e->getBindings() ?? null,
                        'id' => $id,
                    ]);
                    
                    // Phân tích lỗi cụ thể
                    $errorMsg = $e->getMessage();
                    if (strpos($errorMsg, 'Duplicate entry') !== false) {
                        throw new Exception("Deadline này đã tồn tại. Vui lòng kiểm tra lại tiêu đề hoặc ngày giờ.");
                    } elseif (strpos($errorMsg, 'Unknown column') !== false) {
                        throw new Exception("Lỗi cấu trúc dữ liệu. Vui lòng liên hệ quản trị viên.");
                    } elseif (strpos($errorMsg, 'SQLSTATE[HY000]') !== false) {
                        throw new Exception("Không thể kết nối đến cơ sở dữ liệu. Vui lòng thử lại sau.");
                    } else {
                        throw new Exception("Không thể cập nhật deadline. " . $errorMsg);
                    }
                }
            });
        } catch (ValidationException $e) {
            throw $e;
        } catch (ModelNotFoundException $e) {
            throw new Exception("Không tìm thấy deadline hoặc deadline đã bị xóa.");
        } catch (QueryException $e) {
            if (strpos($e->getMessage(), 'SQLSTATE[HY000]') !== false) {
                throw new Exception("Không thể kết nối đến cơ sở dữ liệu.");
            }
            if (strpos($e->getMessage(), 'SQLSTATE[HY000]: General error: 1205') !== false) {
                throw new Exception("Truy vấn quá lâu, hệ thống đã hủy yêu cầu.");
            }
            throw new Exception("Đã xảy ra lỗi không xác định. Vui lòng liên hệ quản trị viên.");
        } catch (Exception $e) {
            throw $e;
        } finally {
            $lock->release();
        }
    }

    public function deleteDeadline(int $id): bool
    {
        // Validate ID
        $id = ValidationHelper::validateId($id);

        // Lock để tránh concurrent deletes
        $lockKey = 'deadline_delete_' . $id;
        $lock = Cache::lock($lockKey, 10); // 10 seconds lock

        if (!$lock->get()) {
            throw new Exception("Đang xử lý yêu cầu xóa. Vui lòng đợi và thử lại.");
        }

        try {
            // Check if already deleted (sau khi có lock để tránh race condition)
            $deletedDeadline = $this->repository->findDeletedById($id);
            if ($deletedDeadline) {
                throw new Exception("Deadline đã bị xóa trước đó. Không thể xóa lại.");
            }

            // Check if exists (chỉ tìm các deadline chưa bị xóa)
            $deadline = $this->repository->findById($id);
            if (!$deadline) {
                // Kiểm tra lại xem có phải đã bị xóa không
                $checkDeletedAgain = $this->repository->findDeletedById($id);
                if ($checkDeletedAgain) {
                    throw new Exception("Deadline đã bị xóa trước đó. Không thể xóa lại.");
                }
                // Nếu không tìm thấy cả deleted và active, có nghĩa là không tồn tại
                throw new Exception("Không tìm thấy deadline. Deadline không tồn tại.");
            }

            return DB::transaction(function () use ($id) {
                try {
                    // Kiểm tra lại một lần nữa trong transaction để đảm bảo
                    $checkDeleted = $this->repository->findDeletedById($id);
                    if ($checkDeleted) {
                        throw new Exception("Deadline đã bị xóa trước đó. Không thể xóa lại.");
                    }
                    
                    $checkExists = $this->repository->findById($id);
                    if (!$checkExists) {
                        // Kiểm tra lại xem có phải đã bị xóa không
                        $checkDeletedInTransaction = $this->repository->findDeletedById($id);
                        if ($checkDeletedInTransaction) {
                            throw new Exception("Deadline đã bị xóa trước đó. Không thể xóa lại.");
                        }
                        throw new Exception("Không tìm thấy deadline. Deadline không tồn tại.");
                    }
                    
                    return $this->repository->softDelete($id);
                } catch (QueryException $e) {
                    // Log chi tiết lỗi để debug
                    \Log::error('DeadlineService deleteDeadline QueryException:', [
                        'message' => $e->getMessage(),
                        'code' => $e->getCode(),
                        'id' => $id,
                    ]);
                    
                    // Phân tích lỗi cụ thể
                    $errorMsg = $e->getMessage();
                    if (strpos($errorMsg, 'SQLSTATE[HY000]') !== false) {
                        throw new Exception("Không thể kết nối đến cơ sở dữ liệu. Vui lòng thử lại sau.");
                    } elseif (strpos($errorMsg, 'Foreign key constraint') !== false) {
                        throw new Exception("Không thể xóa deadline vì đang được sử dụng ở nơi khác.");
                    } else {
                        throw new Exception("Không thể xóa deadline. " . $errorMsg);
                    }
                } catch (Exception $e) {
                    // Re-throw exception với message gốc
                    throw $e;
                }
            });
        } catch (Exception $e) {
            throw $e;
        } finally {
            $lock->release();
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

    public function getPaginatedDeadlines($perPage = 5, $page = 1, bool $includeDeleted = false)
    {
        try {
            [$perPage, $page] = ValidationHelper::validatePagination($perPage, $page);
        } catch (\Exception $e) {
            throw new Exception("Tham số phân trang không hợp lệ: " . $e->getMessage());
        }

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

    public function searchDeadlines(array $filters = [], $perPage = 5, $page = 1)
    {
        try {
            [$perPage, $page] = ValidationHelper::validatePagination($perPage, $page);
        } catch (\Exception $e) {
            throw new Exception("Tham số phân trang không hợp lệ: " . $e->getMessage());
        }

        try {
            $title = $filters['title'] ?? null;
            if ($title) {
                $title = ValidationHelper::sanitizeText($title, 255);
            }

            $deadline_date = $filters['deadline_date'] ?? null;
            
            $details = $filters['details'] ?? null;
            if ($details) {
                $details = ValidationHelper::sanitizeText($details, 255);
            }
            
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

    public function getDeadlineById($id)
    {
        // Validate ID format
        try {
            $id = ValidationHelper::validateId($id);
        } catch (\Exception $e) {
            throw new Exception("ID không hợp lệ. " . $e->getMessage());
        }

        $deadline = $this->repository->findById($id);
        if (!$deadline) {
            throw new Exception("Không tìm thấy deadline hoặc deadline đã bị xóa.");
        }
        return $deadline;
    }

    public function upcoming()
    {
        return $this->repository->upcoming();
    }
}