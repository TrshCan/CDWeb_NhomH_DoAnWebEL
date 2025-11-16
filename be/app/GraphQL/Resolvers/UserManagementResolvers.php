<?php
namespace App\GraphQL\Resolvers;
use App\Services\UserManagementServices;
use App\Services\PermissionService;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class UserManagementResolvers{
    public function __construct(
        private UserManagementServices $UserManagementServices,
        private PermissionService $permissionService
    ) {

    }
    /**
     * Mutation: Cập nhật hồ sơ cá nhân
     */
    public function updateProfile($root, array $args)
    {
        try {
            // Kiểm tra permission
            $user = Auth::user();
            if (!$user) {
                throw ValidationException::withMessages([
                    'permission' => 'Bạn chưa đăng nhập',
                ]);
            }

            // Kiểm tra permission edit_profile
            if (!$this->permissionService->hasPermission($user, 'edit_profile')) {
                throw ValidationException::withMessages([
                    'permission' => 'Bạn không có quyền sử dụng chức năng này.',
                ]);
            }

            // Nếu có upload avatar, kiểm tra permission change_avatar
            if (!empty($args['avatar'])) {
                if (!$this->permissionService->hasPermission($user, 'change_avatar')) {
                    throw ValidationException::withMessages([
                        'permission' => 'Bạn không có quyền đổi avatar.',
                    ]);
                }
            }

            return $this->UserManagementServices->updateProfile($args);
        } catch (\Exception $e) {
            Log::error("Lỗi updateProfile: " . $e->getMessage());
            throw $e;
        }
    }


}

?>
