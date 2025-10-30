<?php

namespace App\GraphQL\Resolvers;

use App\Services\JoinRequestService;
use Illuminate\Support\Facades\Auth;
use GraphQL\Type\Definition\ResolveInfo;
use Nuwave\Lighthouse\Support\Contracts\GraphQLContext;
use App\Models\User;
use Illuminate\Support\Facades\Log;

class JoinRequestResolver
{
    protected $joinRequestService;

    public function __construct(JoinRequestService $joinRequestService)
    {
        $this->joinRequestService = $joinRequestService;
    }

    public function sendJoinRequest(
        $rootValue,
        array $args,
        GraphQLContext $context,
        ResolveInfo $resolveInfo
    ): array {
        try {
            Log::info('=== JOIN REQUEST START ===');
            Log::info('Args received:', $args);

            $userId = $args['userId'];
            Log::info('User ID from args:', ['userId' => $userId]);

            $user = User::find($userId);
            Log::info('User found:', ['user' => $user ? $user->toArray() : null]);

            if (!$user) {
                Log::error('User not found for ID:', ['userId' => $userId]);
                return [
                    'success' => false,
                    'message' => 'User not found',
                ];
            }

            $result = $this->joinRequestService->sendJoinRequest($user, $args['code']);
            Log::info('Service result:', $result);

            return $result;

        } catch (\Exception $e) {
            Log::error('JoinRequestResolver ERROR:', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);

            return [
                'success' => false,
                'message' => 'Internal server error: ' . $e->getMessage()
            ];
        }
    }


    public function approveJoinRequest($root, array $args)
    {
        return $this->joinRequestService->approveJoinRequest($args['id']);
    }

    public function rejectJoinRequest($root, array $args)
    {
        return $this->joinRequestService->rejectJoinRequest($args['id']);
    }

    // app/GraphQL/Resolvers/JoinRequestResolver.php
    public function pendingJoinRequests($root, array $args)
    {
        $userId = (int) $args['userId'];

        return $this->joinRequestService->getPendingRequests($userId);
    }
}
