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
        // Get userId from args if provided, otherwise use Auth (if available)
        $userId = $args['userId'] ?? null;
        // Remove userId from args before passing to service
        $data = $args;
        unset($data['userId']);
        return $this->groupService->createGroup($data, $userId);
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

    /**
     * Query: Get groups by user ID (groups that user is a member of)
     */
    public function groupsByUser($root, array $args): Collection
    {
        return $this->groupService->getGroupsByUserId($args['userId']);
    }

    /**
     * Field resolver: Get users/members of a group
     */
    public function members($root): Collection
    {
        if ($root instanceof Group) {
            // Load users relationship if not already loaded
            if (!$root->relationLoaded('users')) {
                $root->load('users');
            }
            // Filter out any users with null names to prevent GraphQL errors
            return $root->users->filter(function ($user) {
                return !is_null($user->name);
            })->values();
        }
        return new Collection();
    }
}
