<?php

namespace App\GraphQL\Resolvers;

use App\Services\SurveyShareService;
use Illuminate\Support\Facades\Auth;

class SurveyShareResolver
{
    protected $shareService;

    public function __construct(SurveyShareService $shareService)
    {
        $this->shareService = $shareService;
    }

    /**
     * Lấy tất cả shares của survey
     */
    public function getShares($rootValue, array $args)
    {
        return $this->shareService->getSharesBySurveyId($args['survey_id']);
    }

    /**
     * Lấy share dựa trên token
     */
    public function getShareByToken($rootValue, array $args)
    {
        try {
            return $this->shareService->getShareByToken($args['token']);
        } catch (\Exception $e) {
            // Re-throw with proper GraphQL error format to ensure message is passed through
            throw new \GraphQL\Error\Error(
                $e->getMessage(),
                null,
                null,
                [],
                null,
                $e
            );
        }
    }

    /**
     * Lấy hoặc tạo link chia sẻ công khai
     */
    public function getPublicShareLink($rootValue, array $args)
    {
        $userId = Auth::id();
        return $this->shareService->getPublicShareLink($args['survey_id'], $userId);
    }

    /**
     * Mời người dùng qua email
     */
    public function inviteByEmail($rootValue, array $args)
    {
        $userId = Auth::id();
        return $this->shareService->inviteByEmail(
            $args['survey_id'],
            $args['email'],
            $userId
        );
    }

    /**
     * Chia sẻ cho nhóm
     */
    public function shareToGroup($rootValue, array $args)
    {
        $userId = Auth::id();
        return $this->shareService->shareToGroup(
            $args['survey_id'],
            $args['group_id'],
            $userId
        );
    }

    /**
     * Xóa share
     */
    public function deleteShare($rootValue, array $args)
    {
        return $this->shareService->deleteShare($args['id']);
    }
}
