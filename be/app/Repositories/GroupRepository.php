<?php

namespace App\Repositories;

use App\Models\Group;
use Illuminate\Support\Collection;

class GroupRepository
{
    /**
     * Get all groups (with optional pagination later)
     */
    public function getAll(): Collection
    {
        return Group::with('creator')->latest()->get();
    }

    /**
     * Find group by ID
     */
    public function findById(int $id): ?Group
    {
        return Group::with(['creator', 'members', 'posts'])->find($id);
    }

    /**
     * Find group by unique code
     */
    public function findByCode(string $code): ?Group
    {
        return Group::where('code', $code)->first();
    }

    /**
     * Create a new group
     */
    public function create(array $data): Group
    {
        return Group::create($data);
    }

    /**
     * Update an existing group
     */
    public function update(Group $group, array $data): Group
    {
        $group->update($data);
        return $group;
    }

    /**
     * Soft delete a group
     */
    public function delete(Group $group): bool
    {
        return $group->delete();
    }

    /**
     * Search by name
     */
    public function search(string $keyword): Collection
    {
        return Group::where('name', 'LIKE', "%{$keyword}%")
            ->with('creator')
            ->get();
    }
}
