<?php

namespace App\Services;

use App\Repositories\GroupRepository;
use App\Models\Group;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Auth;
use Illuminate\Database\Eloquent\Collection;

class GroupService
{
    protected GroupRepository $groupRepo;

    public function __construct(GroupRepository $groupRepo)
    {
        $this->groupRepo = $groupRepo;
    }

    /**
     * List all groups
     */
    public function getAllGroups(): Collection
    {
        return $this->groupRepo->getAll();
    }

    /**
     * Find a specific group
     */
    public function getGroupById(int $id): ?Group
    {
        return $this->groupRepo->findById($id);
    }

    public function getGroupByCode(string $code): ?Group
    {
        return $this->groupRepo->findByCode($code);
    }

    /**
     * Create a new group
     */
    public function createGroup(array $data, ?int $userId = null): Group
    {
        $userId = $userId ?? Auth::id();
        $data['created_by'] = $data['created_by'] ?? $userId;
        $data['code'] = strtoupper(Str::random(6));

        $group = $this->groupRepo->create($data);

        // Automatically add creator as a member with admin role
        if ($userId) {
            $group->users()->attach($userId, [
                'role' => 'admin',
                'joined_at' => now(),
            ]);
        }

        return $group;
    }

    /**
     * Update group info
     */
    public function updateGroup(int $id, array $data): ?Group
    {
        $group = $this->groupRepo->findById($id);

        if (!$group) {
            return null;
        }

        return $this->groupRepo->update($group, $data);
    }

    /**
     * Delete group
     */
    public function deleteGroup(int $id): bool
    {
        $group = $this->groupRepo->findById($id);

        if (!$group) {
            return false;
        }

        return $this->groupRepo->delete($group);
    }

    /**
     * Search groups by name
     */
    public function searchGroups(string $keyword): Collection
    {
        return $this->groupRepo->search($keyword);
    }

    /**
     * Get groups that a user is a member of AND groups created by the user
     */
    public function getGroupsByUserId(int $userId): Collection
    {
        $user = \App\Models\User::find($userId);
        if (!$user) {
            return new Collection();
        }

        // Get groups the user is a member of
        $joinedGroups = $user->groups()->with(['creator', 'users'])->get();

        // Get groups created by the user (but not already in joined groups)
        $createdGroups = Group::where('created_by', $userId)
            ->with(['creator', 'users'])
            ->get();

        // Merge and remove duplicates
        $allGroups = $joinedGroups->merge($createdGroups)->unique('id');

        return $allGroups;
    }
}