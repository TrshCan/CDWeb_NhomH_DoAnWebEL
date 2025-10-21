<?php

namespace App\Repositories;

use App\Models\Event;

class EventRepository
{
    public function create(array $data): Event
    {
        // Chỉ dùng created_at, không có updated_at
        return Event::create([
            'title' => $data['title'],
            'event_date' => $data['event_date'],
            'location' => $data['location'] ?? null,
            'created_by' => $data['created_by'],
            'created_at' => now(),
        ]);
    }
}