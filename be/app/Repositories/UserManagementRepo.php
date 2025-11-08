<?php
namespace App\Repositories;
use App\Models\User;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use GraphQL\Error\UserError;
class UserManagementRepo {



    public function updateProfile(int $userId, array $data): User
    {
        try {
            $user = User::findOrFail($userId);

            // Nếu có upload ảnh mới
            if (isset($data['avatar']) && $data['avatar'] instanceof \Illuminate\Http\UploadedFile) {
                // Lưu file ảnh vào storage
                $path = $data['avatar']->store('avatars', 'public');
                $user->avatar = $path;
            }

            if (isset($data['name'])) $user->name = $data['name'];
            if (isset($data['email'])) $user->email = $data['email'];
            if (isset($data['address'])) $user->address = $data['address'];

            if (!empty($data['password'])) {
                if (empty($data['current_password'])) {
                    throw new UserError("Vui lòng nhập mật khẩu hiện tại để đổi mật khẩu.");
                }

                // Kiểm tra mật khẩu hiện tại
                if (!Hash::check($data['current_password'], $user->password)) {
                    throw new UserError("Mật khẩu hiện tại không đúng.");
                }

                // Kiểm tra confirm password trùng khớp
                if (!isset($data['password_confirmation']) || $data['password'] !== $data['password_confirmation']) {
                    throw new UserError("Mật khẩu mới và xác nhận mật khẩu không trùng khớp.");
                }

                $user->password = Hash::make($data['password']);
            }


            $user->save();

            return $user;
        } catch (ModelNotFoundException $e) {
            throw new UserError("Không tìm thấy người dùng.");
        } catch (\Exception $e) {
            Log::error("Lỗi khi cập nhật hồ sơ: " . $e->getMessage());
            throw new UserError($e->getMessage());
        }
    }
}
?>
