<?php

namespace App\GraphQL\Resolvers;

use App\Services\EventService;
use App\Models\User;

class EventResolver
{
    protected EventService $eventService;

    public function __construct(EventService $eventService)
    {
        $this->eventService = $eventService;
    }

    /** 🟢 Tạo mới event */
    public function createEvent($_, array $args)
    {
        $input = $args['input'];
        $user = User::find(1); // giả lập user đăng nhập
        return $this->eventService->createEvent($input, $user);
    }

    /** 🟡 Cập nhật event */
    public function updateEvent($_, array $args)
    {
        $id = $args['id'];
        $input = $args['input'];
        $user = User::find(1);

        return $this->eventService->updateEvent($id, $input, $user);
    }

    /** 🔴 Xóa event */
    public function deleteEvent($_, array $args)
    {
        $id = $args['id'];
        return $this->eventService->deleteEvent($id);
    }

    /** 🔍 Lấy danh sách tất cả event */
    public function getAllEvents($_, array $args)
    {
        return $this->eventService->getAllEvents();
    }

    /** 🔍 Lấy chi tiết event theo ID */
    public function getEventById($_, array $args)
    {
        return $this->eventService->getEventById($args['id']);
    }
}