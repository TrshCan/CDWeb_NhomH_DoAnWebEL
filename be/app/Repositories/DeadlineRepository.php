<?php

namespace App\Repositories;
use Carbon\Carbon;
use App\Models\Deadline;

class DeadlineRepository
{
    public function create(array $data): Deadline
    {
        return Deadline::create($data);
    }

    public function update(int $id, array $data): Deadline
    {
        $deadline = Deadline::whereNull('deleted_at')->findOrFail($id);
        $deadline->update($data);
        return $deadline->fresh();
    }

    public function softDelete(int $id): bool
    {
        $deadline = Deadline::findOrFail($id);
        return $deadline->delete();
    }

    public function restore(int $id): bool
    {
        return Deadline::withTrashed()->where('id', $id)->restore();
    }

    public function findById(int $id): ?Deadline
    {
        return Deadline::whereNull('deleted_at')->find($id);
    }

    public function findDeletedById(int $id): ?Deadline
    {
        return Deadline::onlyTrashed()->find($id);
    }

    public function checkConflict(string $title, string $deadline_date, ?int $ignoreId = null): bool
    {
        $query = Deadline::whereNull('deleted_at')
            ->where('title', $title)
            ->where('deadline_date', $deadline_date); // Sửa thành AND thay vì OR để nới lỏng

        if ($ignoreId) {
            $query->where('id', '!=', $ignoreId);
        }

        return $query->exists();
    }

    public function getAllPaginated(?string $title, ?string $deadline_date, ?string $details, bool $includeDeleted, int $perPage, int $page = 1)
    {
        $query = Deadline::query();

        if ($includeDeleted) {
            $query->onlyTrashed();
        } else {
            $query->whereNull('deleted_at');
        }

        if ($title) {
            $query->where('title', 'like', "%$title%");
        }
        if ($deadline_date) {
            $query->where('deadline_date', 'like', "%$deadline_date%");
        }
        if ($details) {
            $query->where('details', 'like', "%$details%");
        }

        return $query->orderByDesc('created_at')->paginate($perPage, ['*'], 'page', $page);
    }
}