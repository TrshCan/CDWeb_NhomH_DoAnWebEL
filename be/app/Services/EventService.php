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
                } catch (\Exception $e) {
                    throw new \Exception("Định dạng ngày tháng không hợp lệ. Định dạng yêu cầu: YYYY-MM-DD HH:mm:ss.");
                }
            }

            $validator = Validator::make($data, [
                'title' => 'required|string|max:255',
                'event_date' => ['required', 'date', 'date_format:Y-m-d H:i:s'],
                'location' => 'nullable|string|max:255',
            ], [
                'title.required' => 'Tiêu đề không được để trống.',
                'title.max' => 'Tiêu đề không được vượt quá 255 ký tự.',
                'event_date.required' => 'Ngày giờ sự kiện không được để trống.',
                'event_date.date' => 'Ngày giờ sự kiện không hợp lệ.',
                'event_date.date_format' => 'Định dạng ngày giờ không hợp lệ. Định dạng yêu cầu: YYYY-MM-DD HH:mm:ss.',
                'location.max' => 'Địa điểm không được vượt quá 255 ký tự.',
            ]);

            if ($validator->fails()) {
                throw new ValidationException($validator);
            }

            // Check conflict
            if ($this->repository->checkConflict($data['title'], $data['event_date'])) {
                throw new \Exception("Đã tồn tại sự kiện khác vào cùng thời điểm hoặc cùng tiêu đề.");
            }

            $data['created_by'] = $user->id;
            $data['created_at'] = now();

            return DB::transaction(function () use ($data) {
                try {
                    return $this->repository->create($data);
                } catch (QueryException $e) {
                    throw new \Exception("Không thể lưu dữ liệu. Vui lòng thử lại sau.");
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
            if ($updatedAt && $event->created_at && $event->created_at->toDateTimeString() !== $updatedAt) {
                throw new \Exception("Dữ liệu đã được cập nhật bởi người khác. Vui lòng tải lại trang trước khi cập nhật.");
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
                } catch (\Exception $e) {
                    throw new \Exception("Định dạng ngày tháng không hợp lệ. Định dạng yêu cầu: YYYY-MM-DD HH:mm:ss.");
                }
            }

            $validator = Validator::make($data, [
                'title' => 'sometimes|required|string|max:255',
                'event_date' => 'sometimes|required|date_format:Y-m-d H:i:s',
                'location' => 'nullable|string|max:255',
            ], [
                'title.required' => 'Tiêu đề không được để trống.',
                'title.max' => 'Tiêu đề không được vượt quá 255 ký tự.',
                'event_date.required' => 'Ngày giờ sự kiện không được để trống.',
                'event_date.date_format' => 'Định dạng ngày giờ không hợp lệ. Định dạng yêu cầu: YYYY-MM-DD HH:mm:ss.',
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
                throw new \Exception("Xung đột với sự kiện khác. Vui lòng chọn thời điểm hoặc tiêu đề khác.");
            }

            return DB::transaction(function () use ($id, $data) {
                try {
                    return $this->repository->update($id, $data);
                } catch (QueryException $e) {
                    throw new \Exception("Không thể lưu dữ liệu. Vui lòng thử lại sau.");
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

        // Check if already deleted
        $deletedEvent = $this->repository->findDeletedById($id);
        if ($deletedEvent) {
            throw new \Exception("Sự kiện đã bị xóa trước đó. Không thể xóa lại.");
        }

        $event = $this->repository->findById($id);
        if (!$event) {
            throw new \Exception("Không tìm thấy sự kiện ID: $id hoặc sự kiện đã bị xóa.");
        }

        return DB::transaction(function () use ($id) {
            try {
                return $this->repository->softDelete($id);
            } catch (QueryException $e) {
                throw new \Exception("Không thể xóa sự kiện. Vui lòng thử lại sau.");
            }
        });
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