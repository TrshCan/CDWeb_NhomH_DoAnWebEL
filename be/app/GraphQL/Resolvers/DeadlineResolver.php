<?php

namespace App\GraphQL\Resolvers;

use App\Services\DeadlineService;
use Illuminate\Validation\ValidationException;

class DeadlineResolver
{
    protected DeadlineService $deadlineService;

    public function __construct(DeadlineService $deadlineService)
    {
        $this->deadlineService = $deadlineService;
    }

    public function createDeadline($_, array $args)
    {
        try {
            return $this->deadlineService->createDeadline($args['input']);
        } catch (ValidationException $e) {
            throw new \Exception(json_encode($e->errors()));
        } catch (\Exception $e) {
            throw new \Exception($e->getMessage());
        }
    }

    public function updateDeadline($_, array $args)
    {
        try {
            $id = is_numeric($args['id']) ? (int)$args['id'] : $args['id'];
            return $this->deadlineService->updateDeadline($id, $args['input']);
        } catch (ValidationException $e) {
            throw new \Exception(json_encode($e->errors()));
        } catch (\Exception $e) {
            throw new \Exception($e->getMessage());
        }
    }

    public function deleteDeadline($_, array $args)
    {
        $id = is_numeric($args['id']) ? (int)$args['id'] : $args['id'];
        return $this->deadlineService->deleteDeadline($id);
    }

    public function restoreDeadline($_, array $args)
    {
        $id = is_numeric($args['id']) ? (int)$args['id'] : $args['id'];
        return $this->deadlineService->restoreDeadline($id);
    }

    public function getPaginatedDeadlines($_, array $args)
    {
        $perPage = $args['perPage'] ?? 3;
        $page = $args['page'] ?? 1;
        $includeDeleted = $args['includeDeleted'] ?? false;
        return $this->deadlineService->getPaginatedDeadlines($perPage, $page, $includeDeleted);
    }

    public function searchDeadlines($_, array $args)
    {
        $filters = $args['filter'] ?? [];
        $perPage = $args['perPage'] ?? 5;
        $page = $args['page'] ?? 1;
        return $this->deadlineService->searchDeadlines($filters, $perPage, $page);
    }

    public function getDeadlineById($_, array $args)
    {
        $id = is_numeric($args['id']) ? (int)$args['id'] : $args['id'];
        return $this->deadlineService->getDeadlineById($id);
    }
}