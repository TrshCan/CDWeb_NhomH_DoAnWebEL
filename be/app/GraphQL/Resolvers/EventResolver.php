<?php

namespace App\GraphQL\Resolvers;

use App\Services\EventService;
use App\Models\User;
use Illuminate\Validation\ValidationException;

class EventResolver
{
    protected EventService $eventService;

    public function __construct(EventService $eventService)
    {
        $this->eventService = $eventService;
    }

    public function createEvent($_, array $args)
    {
        $user = User::find(1); // giả lập user admin
        try {
            return $this->eventService->createEvent($args['input'], $user);
        } catch (ValidationException $e) {
            throw new \Exception(json_encode($e->errors()));
        } catch (\Exception $e) {
            throw new \Exception($e->getMessage());
        }
    }

    public function updateEvent($_, array $args)
    {
        $user = User::find(1);
        try {
            return $this->eventService->updateEvent($args['id'], $args['input'], $user);
        } catch (\Exception $e) {
            throw new \Exception($e->getMessage());
        }
    }

    public function deleteEvent($_, array $args)
    {
        return $this->eventService->deleteEvent($args['id']);
    }

    public function restoreEvent($_, array $args)
    {
        return $this->eventService->restoreEvent($args['id']);
    }

    public function getPaginatedEvents($_, array $args)
    {
        $perPage = $args['perPage'] ?? 5;
        $page = $args['page'] ?? 1;
        $includeDeleted = $args['includeDeleted'] ?? false;
        return $this->eventService->getPaginatedEvents($perPage, $page, $includeDeleted);
    }

    public function searchEvents($_, array $args)
    {
        $filters = $args['filter'] ?? [];
        $perPage = $args['perPage'] ?? 5;
        $page = $args['page'] ?? 1;
        return $this->eventService->searchEvents($filters, $perPage, $page);
    }

    public function getEventById($_, array $args)
    {
        return $this->eventService->getEventById($args['id']);
    }
