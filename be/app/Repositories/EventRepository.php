<?php

namespace App\Repositories;

use App\Models\Event;

class EventRepository
{
    public function create(array $data): Event
    {
        return Event::create($data);
    }

    public function update(int $id, array $data): Event
    {
        $event = Event::findOrFail($id);
        $event->update($data);
        return $event;
    }

    public function softDelete(int $id): bool
    {
       
        $event = Event::findOrFail($id);
        return $event->delete();
    }

    public function restore(int $id): bool
    {
        return Event::withTrashed()->where('id', $id)->restore();
    }

    public function findById(int $id): ?Event
    {
        return Event::whereNull('deleted_at')->find($id);
    }

    public function findDeletedById(int $id): ?Event
    {
        return Event::onlyTrashed()->find($id);
    }

    public function checkConflict(string $title, string $time, ?int $ignoreId = null): bool
    {
        $query = Event::whereNull('deleted_at')
            ->where(function ($q) use ($title, $time) {
                $q->where('title', $title)
                  ->orWhere('event_date', $time);
            });

        if ($ignoreId) {
            $query->where('id', '!=', $ignoreId);
        }

        return $query->exists();
    }

    public function getAllPaginated(?string $title, ?string $time, ?string $location, bool $includeDeleted, int $perPage, int $page = 1)
    {
        $query = Event::query();

        if ($includeDeleted) {
            $query->onlyTrashed(); // Only fetch deleted events
        } else {
            $query->whereNull('deleted_at'); // Only fetch active events
        }

        if ($title) {
            $query->where('title', 'like', "%$title%");
        }
        if ($time) {
            $query->where('event_date', 'like', "%$time%");
        }
        if ($location) {
            $query->where('location', 'like', "%$location%");
        }

        return $query->orderByDesc('created_at')->paginate($perPage, ['*'], 'page', $page);
    }
}