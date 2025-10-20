<?php

namespace App\GraphQL\Resolvers;

use App\Services\DeadlineService;

class DeadlineResolver
{
    protected $service;

    public function __construct(DeadlineService $service)
    {
        $this->service = $service;
    }

    public function all($_, array $args)
    {
        return $this->service->getAllDeadlines();
    }

    public function find($_, array $args)
    {
        return $this->service->getDeadlineById($args['id']);
    }

    public function byUser($_, array $args)
    {
        return $this->service->getDeadlinesByUser($args['user_id']);
    }
}
