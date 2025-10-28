<?php

namespace App\GraphQL\Resolvers;

use App\Services\JoinRequestService;
use Illuminate\Support\Facades\Auth;
use GraphQL\Type\Definition\ResolveInfo;
use Nuwave\Lighthouse\Support\Contracts\GraphQLContext;

class JoinRequestResolver
{
    protected $joinRequestService;

    public function __construct(JoinRequestService $joinRequestService)
    {
        $this->joinRequestService = $joinRequestService;
    }

    public function sendJoinRequest($root, array $args, GraphQLContext $context, ResolveInfo $resolveInfo)
    {
        return $this->joinRequestService->sendJoinRequest($args['code']);
    }

    public function approveJoinRequest($root, array $args)
    {
        return $this->joinRequestService->approveJoinRequest($args['id']);
    }

    public function rejectJoinRequest($root, array $args)
    {
        return $this->joinRequestService->rejectJoinRequest($args['id']);
    }
}
