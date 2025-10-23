<?php

namespace App\Services;

use App\Repositories\EventRepository;
use App\Models\User;
use App\Models\Event;

class EventService
{
    protected EventRepository $repository;

    public function __construct(EventRepository $repository)
    {
        $this->repository = $repository;
    }

    /** 🟢 Tạo event mới */
    public function createEvent(array $data, User $user): Event
    {
        $data['created_by'] = $user->id;

        if (isset($data['event_date']) && strtotime($data['event_date']) < time()) {
            throw new \Exception('Ngày sự kiện không được nhỏ hơn hiện tại.');
        }

        return $this->repository->create($data);
    }

    /** 🟡 Cập nhật event */
    public function updateEvent(int $id, array $data, User $user): Event
    {
        $event = $this->repository->findById($id);

        if (!$event) {
            throw new \Exception("Không tìm thấy sự kiện ID: $id");
        }

        // (Tuỳ ý) kiểm tra quyền sửa: $event->created_by == $user->id

        return $this->repository->update($id, $data);
    }

    /** 🔴 Xóa event */
    public function deleteEvent(int $id): bool
    {
        $event = $this->repository->findById($id);
        if (!$event) {
            throw new \Exception("Không tìm thấy sự kiện ID: $id");
        }

        return $this->repository->delete($id);
    }

    /** 🔍 Lấy danh sách tất cả event */
    public function getAllEvents()
    {
        return $this->repository->getAll();
    }

    /** 🔍 Lấy chi tiết event */
    public function getEventById(int $id)
    {
        return $this->repository->findById($id);
    }
}