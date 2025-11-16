<?php

namespace App\GraphQL\Resolvers;

use App\Services\BadgeService;
use Illuminate\Support\Facades\Log;

class BadgeResolver
{
    public function __construct(private BadgeService $badgeService)
    {
    }

    /**
     * Query: Lấy danh sách badge với phân trang
     */
    public function getBadges($root, array $args)
    {
        try {
            $page = $args['page'] ?? 1;
            $perPage = $args['perPage'] ?? 10;
            $sortBy = $args['sortBy'] ?? 'id';
            $sortOrder = $args['sortOrder'] ?? 'asc';

            return $this->badgeService->getBadges($page, $perPage, $sortBy, $sortOrder);
        } catch (\Exception $e) {
            Log::error("Lỗi getBadges: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Query: Lấy thông tin một badge
     */
    public function getBadge($root, array $args)
    {
        try {
            return $this->badgeService->getBadge($args['id']);
        } catch (\Exception $e) {
            Log::error("Lỗi getBadge: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Mutation: Tạo badge mới
     */
    public function createBadge($root, array $args)
    {
        try {
            return $this->badgeService->createBadge($args);
        } catch (\Exception $e) {
            Log::error("Lỗi createBadge: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Mutation: Cập nhật thông tin badge
     */
    public function updateBadge($root, array $args)
    {
        try {
            $id = $args['id'];
            unset($args['id']);
            return $this->badgeService->updateBadge($id, $args);
        } catch (\Exception $e) {
            Log::error("Lỗi updateBadge: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Mutation: Xóa badge
     */
    public function deleteBadge($root, array $args)
    {
        try {
            return $this->badgeService->deleteBadge($args['id']);
        } catch (\Exception $e) {
            Log::error("Lỗi deleteBadge: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Mutation: Cấp badge cho user
     */
    public function assignBadge($root, array $args)
    {
        try {
            $assignedBy = $args['assigned_by'] ?? null;
            return $this->badgeService->assignBadge($args['badge_id'], $args['user_id'], $assignedBy);
        } catch (\Exception $e) {
            Log::error("Lỗi assignBadge: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Mutation: Thu hồi badge từ user
     */
    public function revokeBadge($root, array $args)
    {
        try {
            return $this->badgeService->revokeBadge($args['badge_id'], $args['user_id']);
        } catch (\Exception $e) {
            Log::error("Lỗi revokeBadge: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Resolver: Lấy danh sách user đã nhận badge
     */
    public function users($root)
    {
        try {
            return $this->badgeService->getBadgeUsers($root->id);
        } catch (\Exception $e) {
            Log::error("Lỗi badge users: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Resolver: Đếm số user đã nhận badge
     */
    public function userCount($root)
    {
        try {
            return $this->badgeService->getBadgeUserCount($root->id);
        } catch (\Exception $e) {
            Log::error("Lỗi badge userCount: " . $e->getMessage());
            return 0;
        }
    }
}

