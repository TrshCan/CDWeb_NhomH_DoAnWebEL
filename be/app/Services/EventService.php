<?php

namespace App\Services;

use App\Repositories\EventRepository;
use App\Models\User;

class EventService
{
    protected EventRepository $repository;

    public function __construct(EventRepository $repository)
    {
        $this->repository = $repository;
    }

    public function createEvent(array $data, User $user)
    {
        // Luôn dùng user id
        $data['created_by'] = $user->id;
        return $this->repository->create($data);
    }
}