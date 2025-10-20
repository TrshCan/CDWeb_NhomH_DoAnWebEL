<?php

namespace App\Repositories;

use App\Models\Deadline;

class DeadlineRepository
{
    public function getAll()
    {
        return Deadline::with('createdBy')->orderBy('deadline_date', 'asc')->get();
    }

    public function find($id)
    {
        return Deadline::with('createdBy')->findOrFail($id);
    }

    public function findByUser($userId)
    {
        return Deadline::with('createdBy')->where('created_by', $userId)->get();
    }
}
