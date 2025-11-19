<?php

namespace App\Services;

use App\Repositories\EventRepository;
use App\Models\User;
use App\Models\Event;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class EventService
{
    protected EventRepository $repository;

    public function __construct(EventRepository $repository)
    {
        $this->repository = $repository;
    }

    public function createEvent(array $data, User $user): Event
    {
        // Normalize event_date format
        if (isset($data['event_date'])) {
            try {
                $date = \Carbon\Carbon::parse($data['event_date']);
                $data['event_date'] = $date->format('Y-m-d H:i:s');
            } catch (\Exception $e) {
                // If parsing fails, validation will catch it
            }
        }

        $validator = Validator::make($data, [
            'title' => 'required|string|max:255',
            'event_date' => ['required', 'date', 'date_format:Y-m-d H:i:s'],
            'location' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            throw new ValidationException($validator);
        }

        if ($this->repository->checkConflict($data['title'], $data['event_date'])) {
            throw new \Exception("Đã tồn tại sự kiện khác vào cùng thời điểm hoặc cùng tiêu đề.");
        }

        $data['created_by'] = $user->id;
        $data['created_at'] = now();

        return $this->repository->create($data);
    }

    public function updateEvent(int $id, array $data, User $user): Event
    {
        $event = $this->repository->findById($id);
        if (!$event) {
            throw new \Exception("Không tìm thấy sự kiện hoặc sự kiện đã bị xóa.");
        }

        if (!$user->isAdmin() && $event->created_by !== $user->id) {
            throw new \Exception("Bạn không có quyền cập nhật sự kiện này.");
        }

        // Normalize event_date format if provided
        if (isset($data['event_date'])) {
            try {
                $date = \Carbon\Carbon::parse($data['event_date']);
                $data['event_date'] = $date->format('Y-m-d H:i:s');
            } catch (\Exception $e) {
                // If parsing fails, validation will catch it
            }
        }

        $validator = Validator::make($data, [
            'title' => 'sometimes|required|string|max:255',
            'event_date' => 'sometimes|required|date_format:Y-m-d H:i:s',
            'location' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            throw new ValidationException($validator);
        }

        if ($this->repository->checkConflict(
            $data['title'] ?? $event->title,
            $data['event_date'] ?? $event->event_date,
            $id
        )) {
            throw new \Exception("Xung đột với sự kiện khác. Vui lòng chọn thời điểm hoặc tiêu đề khác.");
        }

        return $this->repository->update($id, $data);
    }

    public function deleteEvent(int $id): bool
    {
        $event = $this->repository->findById($id);
        if (!$event) {
            throw new \Exception("Không tìm thấy sự kiện ID: $id");
        }

        return $this->repository->softDelete($id);
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

    public function getPaginatedEvents(int $perPage = 5, int $page = 1, bool $includeDeleted = false)
    {
        $paginator = $this->repository->getAllPaginated(null, null, null, $includeDeleted, $perPage, $page);

        return [
            'data' => $paginator->items(),
            'current_page' => $paginator->currentPage(),
            'last_page' => $paginator->lastPage(),
            'total' => $paginator->total(),
        ];
    }

    public function searchEvents(array $filters = [], int $perPage = 5, int $page = 1)
    {
        $title = $filters['title'] ?? null;
        $event_date = $filters['event_date'] ?? null;
        $location = $filters['location'] ?? null;
        $includeDeleted = $filters['include_deleted'] ?? false;

        $paginator = $this->repository->getAllPaginated($title, $event_date, $location, $includeDeleted, $perPage, $page);

        return [
            'data' => $paginator->items(),
            'current_page' => $paginator->currentPage(),
            'last_page' => $paginator->lastPage(),
            'total' => $paginator->total(),
        ];
    }

    public function getEventById(int $id)
    {
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
        return $this->repository->findByUser($userId);
    }

    public function today()
    {
        return $this->repository->today();
    }
    
}