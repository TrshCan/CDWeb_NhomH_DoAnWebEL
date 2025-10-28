<?php

namespace App\Services;

use App\Models\Group;
use App\Repositories\JoinRequestRepository;
use Illuminate\Support\Facades\Auth;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Exception;

class JoinRequestService
{
    protected $joinRequestRepository;

    public function __construct(JoinRequestRepository $joinRequestRepository)
    {
        $this->joinRequestRepository = $joinRequestRepository;
    }

    public function sendJoinRequest(string $code): array
    {
        $user = Auth::user();

        // Find group by code
        $group = Group::where('code', $code)->first();
        if (!$group) {
            throw new ModelNotFoundException('Group not found with this code.');
        }

        // Check if already member
        if ($group->users()->where('users.id', $user->id)->exists()) {
            throw new Exception('You are already a member of this group.');
        }

        // Check if pending request exists
        $existing = $this->joinRequestRepository->findByUserAndGroup($user->id, $group->id);
        if ($existing && $existing->status === 'pending') {
            throw new Exception('Join request already sent and pending.');
        }

        // Create join request
        $joinRequest = $this->joinRequestRepository->create([
            'user_id'   => $user->id,
            'group_id'  => $group->id,
            'status'    => 'pending',
            'created_by' => $user->id,
        ]);

        return [
            'success' => true,
            'message' => 'Join request sent successfully.',
            'joinRequest' => $joinRequest,
        ];
    }

    public function approveJoinRequest($joinRequestId)
    {
        $joinRequest = \App\Models\JoinRequest::findOrFail($joinRequestId);
        $this->joinRequestRepository->updateStatus($joinRequest, 'approved');

        // Add to group_members table (you can adapt this part)
        $joinRequest->group->users()->attach($joinRequest->user_id, [
            'role' => 'member',
            'joined_at' => now(),
        ]);

        return $joinRequest;
    }

    public function rejectJoinRequest($joinRequestId)
    {
        $joinRequest = \App\Models\JoinRequest::findOrFail($joinRequestId);
        $this->joinRequestRepository->updateStatus($joinRequest, 'rejected');

        return $joinRequest;
    }
}
