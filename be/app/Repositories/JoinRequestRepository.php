<?php

namespace App\Repositories;

use App\Models\JoinRequest;

class JoinRequestRepository
{
    public function findByUserAndGroup(int $userId, int $groupId): ?JoinRequest
    {
        return JoinRequest::where('user_id', $userId)
            ->where('group_id', $groupId)
            ->first();
    }

    /**
     * Create a new pending request
     */
    public function create(int $userId, int $groupId): JoinRequest
    {
        return JoinRequest::create([
            'user_id' => $userId,
            'group_id' => $groupId,
            'status' => 'pending',
            'created_by'=> $userId,
        ]);
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

        return $joinRequest->load(['user', 'group']);
    }
}
