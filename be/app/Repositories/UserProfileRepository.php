<?php
namespace App\Repositories;
use App\Models\User;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
class UserProfileRepository {

    /**
     * Lấy thông tin người dùng công khai theo ID
     */
    public function getPublicProfileById(int $id): ?User
    {
        try {
            // Chỉ lấy các trường công khai
            return User::select('name','address', 'created_at')
                        ->where('id', $id)
                        ->first();
        } catch (ModelNotFoundException $e) {
            Log::warning("Không tìm thấy user có ID: {$id}");
            return null;
        } catch (\Exception $e) {
            Log::error("Lỗi khi lấy profile user {$id}: " . $e->getMessage());
            throw new \Exception('Không thể tải thông tin người dùng.');
        }
    }
}
?>
