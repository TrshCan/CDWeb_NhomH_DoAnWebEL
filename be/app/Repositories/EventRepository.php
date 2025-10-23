<?php

namespace App\Repositories;

use App\Models\Event;

class EventRepository
{
    /** 🟢 Tạo mới */
    public function create(array $data): Event
    {
        return Event::create([
            'title' => $data['title'],
            'event_date' => $data['event_date'],
            'location' => $data['location'] ?? null,
            'created_by' => $data['created_by'],
            'created_at' => now(),
        ]);
    }

    /** 🟡 Cập nhật */
    public function update(int $id, array $data): Event
    {
        $event = Event::findOrFail($id);

        $event->update([
            'title' => $data['title'] ?? $event->title,
            'event_date' => $data['event_date'] ?? $event->event_date,
            'location' => $data['location'] ?? $event->location,
        ]);

        return $event;
    }

    /** 🔴 Xóa (soft delete) */
    public function delete(int $id): bool
    {
        $event = Event::findOrFail($id);
        return $event->delete();
    }

    /** 🔍 Lấy tất cả */
    public function getAll()
    {
        return Event::orderByDesc('created_at')->get();
    }

    /** 🔍 Tìm theo ID */
    public function findById(int $id): ?Event
    {
        return Event::find($id);
    }
}