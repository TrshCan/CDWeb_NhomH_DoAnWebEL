<?php

namespace App\Services;

use App\Models\Permission;
use App\Models\RoleDefaultPermission;
use App\Models\User;
use App\Models\UserPermission;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class PermissionService
{
    // Mapping các nhóm quyền theo yêu cầu
    private const PERMISSION_GROUPS = [
        'Bài viết' => [
            'create_post',
            'comment_post',
            'delete_post',
            'like_post',
        ],
        'Người dùng' => [
            'edit_profile',
            'change_avatar',
        ],
        'Hệ thống' => [
            'view_dashboard',
            'manage_users',
            'manage_permissions',
        ],
    ];

    /**
     * Lấy tất cả permissions theo nhóm
     */
    public function getPermissionsGrouped(): array
    {
        $allPermissions = Permission::all()->keyBy('name');
        $groups = [];

        foreach (self::PERMISSION_GROUPS as $groupName => $permissionNames) {
            $permissions = [];
            foreach ($permissionNames as $permissionName) {
                if (isset($allPermissions[$permissionName])) {
                    $permissions[] = $allPermissions[$permissionName];
                }
            }
            if (!empty($permissions)) {
                $groups[] = [
                    'name' => $groupName,
                    'permissions' => $permissions,
                ];
            }
        }

        return $groups;
    }

    /**
     * Lấy quyền của một role
     */
    public function getRolePermissions(string $role): array
    {
        if (!in_array($role, ['student', 'lecturer', 'admin'])) {
            throw ValidationException::withMessages([
                'role' => 'Role không hợp lệ. Chỉ chấp nhận: student, lecturer, admin',
            ]);
        }

        $permissions = RoleDefaultPermission::where('role', $role)
            ->with('permission')
            ->get()
            ->pluck('permission_id')
            ->toArray();

        return [
            'role' => $role,
            'permission_ids' => $permissions,
        ];
    }

    /**
     * Lấy quyền của một user (bao gồm cả quyền từ role)
     */
    public function getUserPermissions(int $userId): array
    {
        $user = User::find($userId);
        if (!$user) {
            throw ValidationException::withMessages([
                'user_id' => 'Không tìm thấy người dùng',
            ]);
        }

        // Lấy quyền cá nhân (user_permissions)
        $userPermissions = UserPermission::where('user_id', $userId)
            ->pluck('permission_id')
            ->toArray();

        return [
            'user_id' => $userId,
            'permission_ids' => $userPermissions,
        ];
    }

    /**
     * Lấy danh sách users để chọn
     */
    public function getUsersForPermission(): array
    {
        return User::select('id', 'name', 'email', 'role')
            ->whereNotNull('role')
            ->get()
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                ];
            })
            ->toArray();
    }

    /**
     * Cập nhật quyền cho role
     */
    public function updateRolePermissions(string $role, array $permissionIds, ?int $adminId = null): bool
    {
        if (!in_array($role, ['student', 'lecturer', 'admin'])) {
            throw ValidationException::withMessages([
                'role' => 'Role không hợp lệ. Chỉ chấp nhận: student, lecturer, admin',
            ]);
        }

        return DB::transaction(function () use ($role, $permissionIds) {
            // Xóa tất cả quyền cũ của role
            RoleDefaultPermission::where('role', $role)->delete();

            // Thêm quyền mới
            if (!empty($permissionIds)) {
                // Validate permission IDs tồn tại
                $validPermissionIds = Permission::whereIn('id', $permissionIds)
                    ->pluck('id')
                    ->toArray();

                $data = [];
                foreach ($validPermissionIds as $permissionId) {
                    $data[] = [
                        'role' => $role,
                        'permission_id' => $permissionId,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                }

                if (!empty($data)) {
                    RoleDefaultPermission::insert($data);
                }
            }

            return true;
        });
    }

    /**
     * Cập nhật quyền cho user (ghi đè quyền role)
     */
    public function updateUserPermissions(int $userId, array $permissionIds, ?int $adminId = null): bool
    {
        $user = User::find($userId);
        if (!$user) {
            throw ValidationException::withMessages([
                'user_id' => 'Không tìm thấy người dùng',
            ]);
        }

        // Lấy admin ID từ auth nếu không truyền vào
        if (!$adminId) {
            $adminId = Auth::id();
        }

        return DB::transaction(function () use ($userId, $permissionIds, $adminId) {
            // Xóa tất cả quyền cá nhân cũ của user
            UserPermission::where('user_id', $userId)->delete();

            // Thêm quyền mới
            if (!empty($permissionIds)) {
                // Validate permission IDs tồn tại
                $validPermissionIds = Permission::whereIn('id', $permissionIds)
                    ->pluck('id')
                    ->toArray();

                $data = [];
                foreach ($validPermissionIds as $permissionId) {
                    $data[] = [
                        'user_id' => $userId,
                        'permission_id' => $permissionId,
                        'granted_at' => now(),
                        'granted_by' => $adminId,
                    ];
                }

                if (!empty($data)) {
                    UserPermission::insert($data);
                }
            }

            return true;
        });
    }

    /**
     * Kiểm tra user có quyền admin không
     */
    public function checkAdminPermission(?User $user = null): bool
    {
        if (!$user) {
            $user = Auth::user();
        }

        if (!$user) {
            return false;
        }

        // Kiểm tra role admin
        if ($user->isAdmin()) {
            return true;
        }

        // Kiểm tra quyền manage_permissions
        $hasPermission = $this->hasPermission($user, 'manage_permissions');
        return $hasPermission;
    }

    /**
     * Kiểm tra user có quyền cụ thể không
     */
    public function hasPermission(User $user, string $permissionName): bool
    {
        // Tìm permission
        $permission = Permission::where('name', $permissionName)->first();
        if (!$permission) {
            return false;
        }

        // Kiểm tra quyền cá nhân trước (ghi đè)
        $userPermission = UserPermission::where('user_id', $user->id)
            ->where('permission_id', $permission->id)
            ->exists();

        if ($userPermission) {
            return true;
        }

        // Kiểm tra quyền từ role
        if ($user->role) {
            $rolePermission = RoleDefaultPermission::where('role', $user->role)
                ->where('permission_id', $permission->id)
                ->exists();

            if ($rolePermission) {
                return true;
            }
        }

        return false;
    }
}

