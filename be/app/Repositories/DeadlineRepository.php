<?php

namespace App\Repositories;

use App\Models\Deadline;
use Carbon\Carbon;

class DeadlineRepository
{
    protected $model;

    public function __construct(Deadline $model)
    {
        $this->model = $model;
    }

    public function getAll()
    {
        return $this->model->with('createdBy')->orderBy('deadline_date', 'asc')->get();
    }

    public function find($id)
    {
        return $this->model->with('createdBy')->findOrFail($id);
    }

    public function findByUser($userId)
    {
        return $this->model->with('createdBy')->where('created_by', $userId)->get();
    }

    public function upcoming()
    {
        return $this->model->whereDate('deadline_date', '>=', Carbon::today()->toDateString())
            ->with(['createdBy'])
            ->orderBy('deadline_date', 'asc')
            ->get();
    }
}
