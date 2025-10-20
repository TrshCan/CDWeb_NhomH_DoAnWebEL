<?php

namespace App\Services;

use App\Repositories\EventRepository;

class EventService
{
    protected $repo;

    public function __construct(EventRepository $repo)
    {
        $this->repo = $repo;
    }

    public function getAllEvents()
    {
        return $this->repo->getAll();
    }

    public function getEventById($id)
    {
        return $this->repo->find($id);
    }

    public function getEventsByUser($userId)
    {
        return $this->repo->findByUser($userId);
    }
}
