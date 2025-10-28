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
    public function createGroup(array $data): Group
    {
        $data['created_by'] = $data['created_by'] ?? Auth::id();
        $data['code'] = strtoupper(Str::random(6));

        return $this->groupRepo->create($data);
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
}
