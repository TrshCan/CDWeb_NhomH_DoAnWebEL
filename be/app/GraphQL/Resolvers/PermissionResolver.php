<?php

namespace App\GraphQL\Resolvers;

use App\Services\PermissionService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class PermissionResolver
{
    public function __construct(private PermissionService $permissionService)
    {
    }

    /**
     * Lấy tất cả permissions theo nhóm
     */
    public function getPermissions()
    {
        // Kiểm tra quyền admin
        $user = Auth::user();
        if (!$this->permissionService->checkAdminPermission($user)) {
            throw ValidationException::withMessages([
                'permission' => 'Bạn không có quyền truy cập chức năng này.',
            ]);
        }

        return $this->permissionService->getPermissionsGrouped();
    }

    /**
     * Lấy quyền của một role
     */
    public function getRolePermissions($_, array $args)
    {
        // Kiểm tra quyền admin
        $user = Auth::user();
        if (!$this->permissionService->checkAdminPermission($user)) {
            throw ValidationException::withMessages([
                'permission' => 'Bạn không có quyền truy cập chức năng này.',
            ]);
        }

        return $this->permissionService->getRolePermissions($args['role']);
    }

    /**
     * Lấy quyền của một user
     */
    public function getUserPermissions($_, array $args)
    {
        // Kiểm tra quyền admin
        $user = Auth::user();
        if (!$this->permissionService->checkAdminPermission($user)) {
            throw ValidationException::withMessages([
                'permission' => 'Bạn không có quyền truy cập chức năng này.',
            ]);
        }

        return $this->permissionService->getUserPermissions($args['user_id']);
    }

    /**
     * Lấy danh sách users để chọn
     */
    public function getUsersForPermission()
    {
        // Kiểm tra quyền admin
        $user = Auth::user();
        if (!$this->permissionService->checkAdminPermission($user)) {
            throw ValidationException::withMessages([
                'permission' => 'Bạn không có quyền truy cập chức năng này.',
            ]);
        }

        return $this->permissionService->getUsersForPermission();
    }

    /**
     * Cập nhật quyền cho role
     */
    public function updateRolePermissions($_, array $args): bool
    {
        // Kiểm tra quyền admin
        $user = Auth::user();
        if (!$this->permissionService->checkAdminPermission($user)) {
            throw ValidationException::withMessages([
                'permission' => 'Bạn không có quyền truy cập chức năng này.',
            ]);
        }

        return $this->permissionService->updateRolePermissions(
            $args['role'],
            $args['permission_ids'] ?? [],
            $user->id
        );
    }

    /**
     * Cập nhật quyền cho user
     */
    public function updateUserPermissions($_, array $args): bool
    {
        // Kiểm tra quyền admin
        $user = Auth::user();
        if (!$this->permissionService->checkAdminPermission($user)) {
            throw ValidationException::withMessages([
                'permission' => 'Bạn không có quyền truy cập chức năng này.',
            ]);
        }

        return $this->permissionService->updateUserPermissions(
            $args['user_id'],
            $args['permission_ids'] ?? [],
            $user->id
        );
    }
}

