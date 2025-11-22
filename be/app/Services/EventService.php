<?php

namespace App\Services;

use App\Repositories\EventRepository;
use App\Models\User;
use App\Models\Event;
use App\Helpers\ValidationHelper;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Validation\ValidationException;
use Illuminate\Database\QueryException;

class EventService
{
    protected EventRepository $repository;

    public function __construct(EventRepository $repository)
    {
        $this->repository = $repository;
    }

    public function createEvent(array $data, User $user): Event
    {
        // Prevent duplicate submissions using cache lock
        $lockKey = 'event_create_' . md5(json_encode($data) . $user->id);
        $lock = Cache::lock($lockKey, 5); // 5 seconds lock

        if (!$lock->get()) {
            throw new \Exception("Đang xử lý yêu cầu. Vui lòng đợi và thử lại.");
        }

        try {
            // Sanitize và validate title
            $data['title'] = ValidationHelper::sanitizeTitle($data['title'] ?? '');

            // Sanitize location
            if (isset($data['location']) && !empty($data['location'])) {
                $data['location'] = ValidationHelper::sanitizeText($data['location'], 255);
            } else {
                $data['location'] = null;
            }

            // Normalize và validate event_date format
            if (isset($data['event_date'])) {
                try {
                    $date = \Carbon\Carbon::parse($data['event_date']);
                    $data['event_date'] = $date->format('Y-m-d H:i:s');
                    
                    // Kiểm tra event_date phải lớn hơn thời điểm hiện tại
                    if ($date->lte(\Carbon\Carbon::now())) {
                        throw new \Exception("Ngày giờ diễn ra sự kiện phải lớn hơn thời điểm hiện tại.");
                    }
                } catch (\Exception $e) {
                    if (strpos($e->getMessage(), 'Ngày giờ diễn ra sự kiện') !== false) {
                        throw $e;
                    }
                    throw new \Exception("Định dạng ngày tháng không hợp lệ. Định dạng yêu cầu: YYYY-MM-DD HH:mm:ss.");
                }
            }

            $validator = Validator::make($data, [
                'title' => 'required|string|max:255',
                'event_date' => ['required', 'date', 'date_format:Y-m-d H:i:s', 'after:now'],
                'location' => 'nullable|string|max:255',
            ], [
                'title.required' => 'Tiêu đề không được để trống.',
                'title.max' => 'Tiêu đề không được vượt quá 255 ký tự.',
                'event_date.required' => 'Ngày giờ sự kiện không được để trống.',
                'event_date.date' => 'Ngày giờ sự kiện không hợp lệ.',
                'event_date.date_format' => 'Định dạng ngày giờ không hợp lệ. Định dạng yêu cầu: YYYY-MM-DD HH:mm:ss.',
                'event_date.after' => 'Ngày giờ diễn ra sự kiện phải lớn hơn thời điểm hiện tại.',
                'location.max' => 'Địa điểm không được vượt quá 255 ký tự.',
            ]);

            if ($validator->fails()) {
                throw new ValidationException($validator);
            }

            // Check conflict
            if ($this->repository->checkConflict($data['title'], $data['event_date'])) {
                $validator = Validator::make([], []);
                $validator->errors()->add('title', 'Đã tồn tại sự kiện khác vào cùng thời điểm hoặc cùng tiêu đề.');
                throw new ValidationException($validator);
            }

            $data['created_by'] = $user->id;
            $data['created_at'] = now()->toDateTimeString();
            $data['updated_at'] = now()->toDateTimeString(); // Set updated_at khi tạo mới

            return DB::transaction(function () use ($data) {
                try {
                    return $this->repository->create($data);
                } catch (QueryException $e) {
                    // Log chi tiết lỗi để debug
                    \Log::error('EventService createEvent QueryException:', [
                        'message' => $e->getMessage(),
                        'code' => $e->getCode(),
                        'sql' => $e->getSql() ?? null,
                        'bindings' => $e->getBindings() ?? null,
                    ]);
                    
                    // Phân tích lỗi cụ thể
                    $errorMsg = $e->getMessage();
                    if (strpos($errorMsg, 'Duplicate entry') !== false) {
                        throw new \Exception("Sự kiện này đã tồn tại. Vui lòng kiểm tra lại tiêu đề hoặc ngày giờ.");
                    } elseif (strpos($errorMsg, 'Unknown column') !== false) {
                        throw new \Exception("Lỗi cấu trúc dữ liệu. Vui lòng liên hệ quản trị viên.");
                    } elseif (strpos($errorMsg, 'SQLSTATE[HY000]') !== false) {
                        throw new \Exception("Không thể kết nối đến cơ sở dữ liệu. Vui lòng thử lại sau.");
                    } else {
                        throw new \Exception("Không thể tạo sự kiện. " . $errorMsg);
                    }
                }
            });
        } finally {
            $lock->release();
        }
    }

    public function updateEvent(int $id, array $data, User $user, ?string $updatedAt = null): Event
    {
        // Validate ID
        $id = ValidationHelper::validateId($id);

        // Lock để tránh concurrent updates
        $lockKey = 'event_update_' . $id;
        $lock = Cache::lock($lockKey, 10); // 10 seconds lock

        if (!$lock->get()) {
            throw new \Exception("Đang xử lý yêu cầu cập nhật. Vui lòng đợi và thử lại.");
        }

        try {
            $event = $this->repository->findById($id);
            if (!$event) {
                throw new \Exception("Không tìm thấy sự kiện hoặc sự kiện đã bị xóa.");
            }

            // Optimistic locking: Kiểm tra nếu có updated_at và không khớp
            if ($updatedAt) {
                // Lấy updated_at hiện tại, nếu không có thì dùng created_at (cho records cũ)
                $currentUpdatedAt = null;
                if ($event->updated_at) {
                    $currentUpdatedAt = is_string($event->updated_at) 
                        ? \Carbon\Carbon::parse($event->updated_at)->toDateTimeString()
                        : $event->updated_at->toDateTimeString();
                } elseif ($event->created_at) {
                    // Fallback cho records cũ chưa có updated_at
                    $currentUpdatedAt = is_string($event->created_at)
                        ? \Carbon\Carbon::parse($event->created_at)->toDateTimeString()
                        : $event->created_at->toDateTimeString();
                }
                
                if ($currentUpdatedAt && $currentUpdatedAt !== $updatedAt) {
                    throw new \Exception("Dữ liệu đã được cập nhật bởi người khác. Vui lòng tải lại trang trước khi cập nhật.");
                }
            }

            if (!$user->isAdmin() && $event->created_by !== $user->id) {
                throw new \Exception("Bạn không có quyền cập nhật sự kiện này.");
            }

            // Sanitize và validate title nếu có
            if (isset($data['title'])) {
                $data['title'] = ValidationHelper::sanitizeTitle($data['title']);
            }

            // Sanitize location nếu có
            if (isset($data['location'])) {
                if (!empty($data['location'])) {
                    $data['location'] = ValidationHelper::sanitizeText($data['location'], 255);
                } else {
                    $data['location'] = null;
                }
            }

            // Normalize và validate event_date format if provided
            if (isset($data['event_date'])) {
                try {
                    $date = \Carbon\Carbon::parse($data['event_date']);
                    $data['event_date'] = $date->format('Y-m-d H:i:s');
                    
                    // Kiểm tra event_date phải lớn hơn thời điểm hiện tại
                    if ($date->lte(\Carbon\Carbon::now())) {
                        throw new \Exception("Ngày giờ diễn ra sự kiện phải lớn hơn thời điểm hiện tại.");
                    }
                } catch (\Exception $e) {
                    if (strpos($e->getMessage(), 'Ngày giờ diễn ra sự kiện') !== false) {
                        throw $e;
                    }
                    throw new \Exception("Định dạng ngày tháng không hợp lệ. Định dạng yêu cầu: YYYY-MM-DD HH:mm:ss.");
                }
            }

            $validator = Validator::make($data, [
                'title' => 'sometimes|required|string|max:255',
                'event_date' => 'sometimes|required|date_format:Y-m-d H:i:s|after:now',
                'location' => 'nullable|string|max:255',
            ], [
                'title.required' => 'Tiêu đề không được để trống.',
                'title.max' => 'Tiêu đề không được vượt quá 255 ký tự.',
                'event_date.required' => 'Ngày giờ sự kiện không được để trống.',
                'event_date.date_format' => 'Định dạng ngày giờ không hợp lệ. Định dạng yêu cầu: YYYY-MM-DD HH:mm:ss.',
                'event_date.after' => 'Ngày giờ diễn ra sự kiện phải lớn hơn thời điểm hiện tại.',
                'location.max' => 'Địa điểm không được vượt quá 255 ký tự.',
            ]);

            if ($validator->fails()) {
                throw new ValidationException($validator);
            }

            // Check conflict
            if ($this->repository->checkConflict(
                $data['title'] ?? $event->title,
                $data['event_date'] ?? $event->event_date,
                $id
            )) {
                $validator = Validator::make([], []);
                $validator->errors()->add('title', 'Xung đột với sự kiện khác. Vui lòng chọn thời điểm hoặc tiêu đề khác.');
                throw new ValidationException($validator);
            }

            return DB::transaction(function () use ($id, $data) {
                try {
                    // Set updated_at khi update
                    $data['updated_at'] = now()->toDateTimeString();
                    return $this->repository->update($id, $data);
                } catch (QueryException $e) {
                    // Log chi tiết lỗi để debug
                    \Log::error('EventService updateEvent QueryException:', [
                        'message' => $e->getMessage(),
                        'code' => $e->getCode(),
                        'sql' => $e->getSql() ?? null,
                        'bindings' => $e->getBindings() ?? null,
                        'id' => $id,
                    ]);
                    
                    // Phân tích lỗi cụ thể
                    $errorMsg = $e->getMessage();
                    if (strpos($errorMsg, 'Duplicate entry') !== false) {
                        throw new \Exception("Sự kiện này đã tồn tại. Vui lòng kiểm tra lại tiêu đề hoặc ngày giờ.");
                    } elseif (strpos($errorMsg, 'Unknown column') !== false) {
                        throw new \Exception("Lỗi cấu trúc dữ liệu. Vui lòng liên hệ quản trị viên.");
                    } elseif (strpos($errorMsg, 'SQLSTATE[HY000]') !== false) {
                        throw new \Exception("Không thể kết nối đến cơ sở dữ liệu. Vui lòng thử lại sau.");
                    } else {
                        throw new \Exception("Không thể cập nhật sự kiện. " . $errorMsg);
                    }
                }
            });
        } finally {
            $lock->release();
        }
    }

    public function deleteEvent(int $id): bool
    {
        // Validate ID
        $id = ValidationHelper::validateId($id);

        // Lock để tránh concurrent deletes
        $lockKey = 'event_delete_' . $id;
        $lock = Cache::lock($lockKey, 10); // 10 seconds lock

        if (!$lock->get()) {
            throw new \Exception("Đang xử lý yêu cầu xóa. Vui lòng đợi và thử lại.");
        }

        try {
            // Check if already deleted (sau khi có lock để tránh race condition)
            $deletedEvent = $this->repository->findDeletedById($id);
            if ($deletedEvent) {
                throw new \Exception("Sự kiện đã bị xóa trước đó. Không thể xóa lại.");
            }

            // Check if exists (chỉ tìm các event chưa bị xóa)
            $event = $this->repository->findById($id);
            if (!$event) {
                // Kiểm tra lại xem có phải đã bị xóa không
                $checkDeletedAgain = $this->repository->findDeletedById($id);
                if ($checkDeletedAgain) {
                    throw new \Exception("Sự kiện đã bị xóa trước đó. Không thể xóa lại.");
                }
                // Nếu không tìm thấy cả deleted và active, có nghĩa là không tồn tại
                throw new \Exception("Không tìm thấy sự kiện. Sự kiện không tồn tại.");
            }

            return DB::transaction(function () use ($id) {
                try {
                    // Kiểm tra lại một lần nữa trong transaction để đảm bảo
                    $checkDeleted = $this->repository->findDeletedById($id);
                    if ($checkDeleted) {
                        throw new \Exception("Sự kiện đã bị xóa trước đó. Không thể xóa lại.");
                    }
                    
                    $checkExists = $this->repository->findById($id);
                    if (!$checkExists) {
                        // Kiểm tra lại xem có phải đã bị xóa không
                        $checkDeletedInTransaction = $this->repository->findDeletedById($id);
                        if ($checkDeletedInTransaction) {
                            throw new \Exception("Sự kiện đã bị xóa trước đó. Không thể xóa lại.");
                        }
                        throw new \Exception("Không tìm thấy sự kiện. Sự kiện không tồn tại.");
                    }
                    
                    return $this->repository->softDelete($id);
                } catch (QueryException $e) {
                    // Log chi tiết lỗi để debug
                    \Log::error('EventService deleteEvent QueryException:', [
                        'message' => $e->getMessage(),
                        'code' => $e->getCode(),
                        'id' => $id,
                    ]);
                    
                    // Phân tích lỗi cụ thể
                    $errorMsg = $e->getMessage();
                    if (strpos($errorMsg, 'SQLSTATE[HY000]') !== false) {
                        throw new \Exception("Không thể kết nối đến cơ sở dữ liệu. Vui lòng thử lại sau.");
                    } elseif (strpos($errorMsg, 'Foreign key constraint') !== false) {
                        throw new \Exception("Không thể xóa sự kiện vì đang được sử dụng ở nơi khác.");
                    } else {
                        throw new \Exception("Không thể xóa sự kiện. " . $errorMsg);
                    }
                } catch (\Exception $e) {
                    // Re-throw exception với message gốc
                    throw $e;
                }
            });
        } catch (\Exception $e) {
            // Đảm bảo message được giữ nguyên
            throw $e;
        } finally {
            $lock->release();
        }
    }

    public function restoreEvent(int $id): bool
    {
        $event = $this->repository->findDeletedById($id);
        if (!$event) {
            throw new \Exception("Không tìm thấy sự kiện đã xóa.");
        }

        if ($this->repository->checkConflict($event->title, $event->event_date)) {
            throw new \Exception("Không thể khôi phục sự kiện. Dữ liệu bị trùng thời điểm hoặc tiêu đề.");
        }

        return $this->repository->restore($id);
    }

    public function getPaginatedEvents($perPage = 5, $page = 1, bool $includeDeleted = false)
    {
        try {
            [$perPage, $page] = ValidationHelper::validatePagination($perPage, $page);
        } catch (\Exception $e) {
            throw new \Exception("Tham số phân trang không hợp lệ: " . $e->getMessage());
        }

        $paginator = $this->repository->getAllPaginated(null, null, null, $includeDeleted, $perPage, $page);

        return [
            'data' => $paginator->items(),
            'current_page' => $paginator->currentPage(),
            'last_page' => $paginator->lastPage(),
            'total' => $paginator->total(),
        ];
    }

    public function searchEvents(array $filters = [], $perPage = 5, $page = 1)
    {
        try {
            [$perPage, $page] = ValidationHelper::validatePagination($perPage, $page);
        } catch (\Exception $e) {
            throw new \Exception("Tham số phân trang không hợp lệ: " . $e->getMessage());
        }

        $title = $filters['title'] ?? null;
        if ($title) {
            $title = ValidationHelper::sanitizeText($title, 255);
        }

        $event_date = $filters['event_date'] ?? null;
        $location = $filters['location'] ?? null;
        if ($location) {
            $location = ValidationHelper::sanitizeText($location, 255);
        }
        $includeDeleted = $filters['include_deleted'] ?? false;

        $paginator = $this->repository->getAllPaginated($title, $event_date, $location, $includeDeleted, $perPage, $page);

        return [
            'data' => $paginator->items(),
            'current_page' => $paginator->currentPage(),
            'last_page' => $paginator->lastPage(),
            'total' => $paginator->total(),
        ];
    }

    public function getEventById($id)
    {
        // Validate ID format
        try {
            $id = ValidationHelper::validateId($id);
        } catch (\Exception $e) {
            throw new \Exception("ID không hợp lệ. " . $e->getMessage());
        }

        $event = $this->repository->findById($id);
        if (!$event) {
            throw new \Exception("Không tìm thấy sự kiện hoặc sự kiện đã bị xóa.");
        }
        return $event;
    }

    public function getAllEvents()
    {
        return $this->repository->getAll();
    }

    public function getEventsByUser($userId)
    {
        try {
            $userId = ValidationHelper::validateId($userId);
        } catch (\Exception $e) {
            throw new \Exception("User ID không hợp lệ: " . $e->getMessage());
        }

        return $this->repository->findByUser($userId);
    }

    public function today()
    {
        return $this->repository->today();
    }
    
}