<?php

namespace App\GraphQL\Resolvers;

use App\Services\EventService;

class EventResolver
{
    protected $service;

    public function __construct(EventService $service)
    {
        $this->service = $service;
    }

    public function all($_, array $args)
    {
        return $this->service->getAllEvents();
    }

    public function find($_, array $args)
    {
        return $this->service->getEventById($args['id']);
    }

    public function byUser($_, array $args)
    {
        return $this->service->getEventsByUser($args['user_id']);
    }

    public function today($_, array $args)
    {
        return $this->service->today();
    }
}
