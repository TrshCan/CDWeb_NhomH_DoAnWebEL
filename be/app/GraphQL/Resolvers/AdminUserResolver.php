<?php

namespace App\GraphQL\Resolvers;

use App\Services\AdminUserService;
use Illuminate\Support\Facades\Log;

class AdminUserResolver
{
    public function __construct(private AdminUserService $adminUserService)
    {
    }

    /**
     * Query: Lấy danh sách người dùng với phân trang
     */
    public function getUsers($root, array $args)
    {
        try {
            $page = $args['page'] ?? 1;
            $perPage = $args['perPage'] ?? 5;
            $sortBy = $args['sortBy'] ?? 'id';
            $sortOrder = $args['sortOrder'] ?? 'asc';

            return $this->adminUserService->getUsers($page, $perPage, $sortBy, $sortOrder);
        } catch (\Exception $e) {
            Log::error("Lỗi getUsers: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Query: Lấy thông tin một người dùng
     */
    public function getUser($root, array $args)
    {
        try {
            return $this->adminUserService->getUser($args['id']);
        } catch (\Exception $e) {
            Log::error("Lỗi getUser: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Mutation: Tạo người dùng mới
     */
    public function createUser($root, array $args)
    {
        try {
            return $this->adminUserService->createUser($args);
        } catch (\Exception $e) {
            Log::error("Lỗi createUser: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Mutation: Cập nhật thông tin người dùng
     */
    public function updateUser($root, array $args)
    {
        try {
            $id = $args['id'];
            unset($args['id']);
            return $this->adminUserService->updateUser($id, $args);
        } catch (\Exception $e) {
            Log::error("Lỗi updateUser: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Mutation: Xóa người dùng
     */
    public function deleteUser($root, array $args)
    {
        try {
            return $this->adminUserService->deleteUser($args['id']);
        } catch (\Exception $e) {
            Log::error("Lỗi deleteUser: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Mutation: Chuyển đổi trạng thái người dùng
     */
    public function toggleUserStatus($root, array $args)
    {
        try {
            $ban_reason = $args['ban_reason'] ?? null;
            return $this->adminUserService->toggleUserStatus($args['id'], $ban_reason);
        } catch (\Exception $e) {
            Log::error("Lỗi toggleUserStatus: " . $e->getMessage());
            throw $e;
        }
    }
}

