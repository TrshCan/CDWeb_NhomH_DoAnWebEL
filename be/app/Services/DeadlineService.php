<?php

namespace App\Services;

use App\Repositories\DeadlineRepository;

class DeadlineService
{
    protected $repo;

    public function __construct(DeadlineRepository $repo)
    {
        $this->repo = $repo;
    }

    public function getAllDeadlines()
    {
        return $this->repo->getAll();
    }

    public function getDeadlineById($id)
    {
        return $this->repo->find($id);
    }

    public function getDeadlinesByUser($userId)
    {
        return $this->repo->findByUser($userId);
    }

    public function upcoming()
    {
        return $this->repo->upcoming();
    }
}
