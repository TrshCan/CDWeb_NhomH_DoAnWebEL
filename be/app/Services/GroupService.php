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
        $authenticatedUserId = Auth::id();
        $userId = $userId ?? $authenticatedUserId;
        
        if (!$userId) {
            throw new \Exception('User must be authenticated to create a group');
        }

        // Verify user exists and get user object
        $user = \App\Models\User::find($userId);
        if (!$user) {
            throw new \Exception('User not found');
        }

        // Security check: Only lecturers and admins can create groups
        if ($user->role !== 'lecturer' && $user->role !== 'admin') {
            throw new \Exception('Only lecturers and admins can create groups');
        }

        // Additional security: Verify userId matches authenticated user
        // Unless authenticated user is admin (admins can create on behalf of others)
        if ($authenticatedUserId) {
            $authenticatedUser = \App\Models\User::find($authenticatedUserId);
            if ($authenticatedUser && $authenticatedUser->role !== 'admin') {
                if ($userId != $authenticatedUserId) {
                    throw new \Exception('You can only create groups for yourself');
                }
            }
        }

        $data['created_by'] = $data['created_by'] ?? $userId;
        $data['code'] = strtoupper(Str::random(6));

        $group = $this->groupRepo->create($data);

        // Automatically add creator as a member with admin role
        // Check if user is not already a member (shouldn't happen on create, but safety check)
        if ($userId && !$group->users()->where('users.id', $userId)->exists()) {
            $group->users()->attach($userId, [
                'role' => 'admin',
                'joined_at' => now(),
            ]);
        }

        // Reload the group to ensure relationships are fresh
        return $group->fresh(['creator', 'users']);
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

    /**
     * Check if user is a member of a specific group or is the creator
     */
    public function isUserMemberOfGroup(int $userId, int $groupId): bool
    {
        $user = \App\Models\User::find($userId);
        if (!$user) {
            return false;
        }

        $group = $this->groupRepo->findById($groupId);
        if (!$group) {
            return false;
        }

        // Check if user is the creator
        if ($group->created_by === $userId) {
            return true;
        }

        // Check if user is a member
        return $user->groups()->where('groups.id', $groupId)->exists();
    }
}