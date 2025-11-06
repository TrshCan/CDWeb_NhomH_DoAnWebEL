<?php
namespace App\Repositories;
use App\Models\User;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
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

            // Cập nhật các trường cơ bản
            if (isset($data['name'])) $user->name = $data['name'];
            if (isset($data['email'])) $user->email = $data['email'];
            if (isset($data['address'])) $user->address = $data['address'];

            // Cập nhật mật khẩu (nếu có)
            if (!empty($data['password'])) {
                $user->password = Hash::make($data['password']);
            }

            $user->save();

            return $user;
        } catch (ModelNotFoundException $e) {
            throw new \Exception("Không tìm thấy người dùng.");
        } catch (\Exception $e) {
            Log::error("Lỗi khi cập nhật hồ sơ: " . $e->getMessage());
            throw new \Exception("Không thể cập nhật hồ sơ.");
        }
    }
}
?>
