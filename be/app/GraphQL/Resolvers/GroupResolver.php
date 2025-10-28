<?php

namespace App\GraphQL\Resolvers;

use App\Services\GroupService;
use App\Models\Group;
use Illuminate\Support\Facades\Auth;
use Illuminate\Database\Eloquent\Collection;

class GroupResolver
{
    protected GroupService $groupService;

    public function __construct(GroupService $groupService)
    {
        $this->groupService = $groupService;
    }

    /**
     * Query: Get all groups
     */
    public function all(): Collection
    {
        return $this->groupService->getAllGroups();
    }

    /**
     * Query: Get a single group by ID
     */
    public function find($root, array $args): ?Group
    {
        return $this->groupService->getGroupById($args['id']);
    }

    /**
     * Query: Get a group by code
     */
    public function findByCode($root, array $args): ?Group
    {
        return $this->groupService->getGroupByCode($args['code']);
    }

    /**
     * Mutation: Create new group
     */
    public function create($root, array $args): Group
    {
        return $this->groupService->createGroup($args);
    }

    /**
     * Mutation: Update group
     */
    public function update($root, array $args): ?Group
    {
        return $this->groupService->updateGroup($args['id'], $args);
    }

    /**
     * Mutation: Delete group
     */
    public function delete($root, array $args): bool
    {
        return $this->groupService->deleteGroup($args['id']);
    }

    /**
     * Query: Search groups
     */
    public function search($root, array $args): Collection
    {
        return $this->groupService->searchGroups($args['keyword']);
    }
}
