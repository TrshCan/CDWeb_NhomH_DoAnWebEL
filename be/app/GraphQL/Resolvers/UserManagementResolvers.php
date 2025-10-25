<?php
namespace App\GraphQL\Resolvers;
use App\Services\UserManagementServices;
use Illuminate\Support\Facades\Log;

class UserManagementResolvers{
    public function __construct(private UserManagementServices $UserManagementServices)
    {

    }
    /**
     * Mutation: Cập nhật hồ sơ cá nhân
     */
    public function updateProfile($root, array $args)
    {
        try {
            return $this->UserManagementServices->updateProfile($args);
        } catch (\Exception $e) {
            Log::error("Lỗi updateProfile: " . $e->getMessage());
            throw $e;
        }
    }


}

?>
