<?php

namespace App\Repositories;

use App\Models\JoinRequest;

class JoinRequestRepository
{
    public function create(array $data): JoinRequest
    {
        return JoinRequest::create($data);
    }

    public function findByUserAndGroup($userId, $groupId): ?JoinRequest
    {
        return JoinRequest::where('user_id', $userId)
            ->where('group_id', $groupId)
            ->first();
    }

    public function findPendingForGroup($groupId)
    {
        return JoinRequest::where('group_id', $groupId)
            ->where('status', 'pending')
            ->get();
    }

    public function updateStatus(JoinRequest $joinRequest, string $status): JoinRequest
    {
        $joinRequest->status = $status;
        $joinRequest->save();

        return $joinRequest;
    }
}
