<?php

namespace App\Services;

use App\Models\Group;
use App\Repositories\JoinRequestRepository;
use App\Repositories\GroupRepository;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\Validator;
use Exception;

class JoinRequestService
{
    protected $joinRequestRepository;

    public function __construct(
        protected JoinRequestRepository $joinRequestRepo,
        protected GroupRepository $groupRepo
    ) {
    }

    /**
     * Send a join request by group code.
     *
     * Returns array matching JoinRequestResponse { success, message, joinRequest }
     *
     * Throws exceptions for not found / invalid states.
     */
    public function sendJoinRequest(User $user, string $code): array
    {
        $code = strtoupper(trim($code));

        $validator = Validator::make(
            ['code' => $code],
            ['code' => 'required|string|size:6|alpha_num'],
            [],
            ['code' => 'Group code']
        );

        if ($validator->fails()) {
            return [
                'success' => false,
                'message' => $validator->errors()->first('code'),
            ];
        }

        // 1. Find the group
        $group = $this->groupRepo->findByCode($code);

        if (!$group) {
            return [
                'success' => false,
                'message' => 'Group with this code does not exist',
            ];
        }

        // 2. Prevent duplicate request / already member
        $existing = $this->joinRequestRepo->findByUserAndGroup($user->id, $group->id);

        if ($existing) {
            return [
                'success' => false,
                'message' => 'You already have a pending request or are already a member of this group',
            ];
        }

        // 3. Creator cannot request to join his own group
        if ($group->created_by == $user->id) {
            return [
                'success' => false,
                'message' => 'You are the creator of this group',
            ];
        }

        // 4. Create the request
        $joinRequest = $this->joinRequestRepo->create($user->id, $group->id);

        return [
            'success' => true,
            'message' => 'Join request sent successfully',
            'joinRequest' => $joinRequest->load(['user', 'group']),
        ];
    }

    public function approveJoinRequest($joinRequestId)
    {
        $joinRequest = \App\Models\JoinRequest::findOrFail($joinRequestId);

        $updated = $this->joinRequestRepo->updateStatus($joinRequest, 'approved');

        // Add user to group members — ensure pivot doesn't duplicate
        $group = $updated->group;
        if (!$group->users()->where('users.id', $updated->user_id)->exists()) {
            $group->users()->attach($updated->user_id, [
                'role' => 'member',
                'joined_at' => now(),
            ]);
        }

        return $updated;
    }

    public function rejectJoinRequest($joinRequestId)
    {
        $joinRequest = \App\Models\JoinRequest::findOrFail($joinRequestId);
        return $this->joinRequestRepo->updateStatus($joinRequest, 'rejected');
    }

    public function getPendingRequests(int $userId): array
    {
        return $this->joinRequestRepo
            ->getPendingByUser($userId)
            ->toArray();
    }

    public function findPendingForGroup(int $groupId): array
    {
        $requests = $this->joinRequestRepo->findPendingForGroup($groupId);
        // Eager load related user and group for each request
        $requests->load(['user', 'group']);
        return $requests->toArray();
    }
}
