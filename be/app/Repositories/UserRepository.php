<?php
namespace App\Repositories;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
class UserRepository {
 /**
     * Tìm user theo email.
     */
    public function findByEmail(string $email): ?User
    {
        return User::where('email', $email)->first();
    }

    /**
     * Kiểm tra mật khẩu có khớp với user hay không.
     */
    public function checkPassword(User $user, string $password): bool
    {
        return Hash::check($password, $user->password);
    }
}
?>
