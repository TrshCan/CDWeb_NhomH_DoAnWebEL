<?php

namespace App\Repositories;

use App\Models\Event;

class EventRepository
{
    public function getAll()
    {
        return Event::with('createdBy')->orderBy('event_date', 'asc')->get();
    }

    public function find($id)
    {
        return Event::with('createdBy')->findOrFail($id);
    }

    public function findByUser($userId)
    {
        return Event::with('createdBy')->where('created_by', $userId)->get();
    }
}
