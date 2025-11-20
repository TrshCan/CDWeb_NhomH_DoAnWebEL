<?php

namespace App\Repositories;

use App\Models\Event;
use Carbon\Carbon;

class EventRepository
{
    protected $model;

    public function __construct(Event $model)
    {
        $this->model = $model;
    }

    public function getAll()
    {
        return $this->model->with('createdBy')->orderBy('event_date', 'asc')->get();
    }

    public function find($id)
    {
        return $this->model->with('createdBy')->findOrFail($id);
    }

    public function findByUser($userId)
    {
        return $this->model->with('createdBy')->where('created_by', $userId)->get();
    }

    public function today()
    {
        return $this->model->whereBetween('event_date', [
            Carbon::today()->startOfDay(),
            Carbon::today()->endOfDay()
        ])
            ->with(['createdBy'])
            ->get();
    }
}
