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
    public function findByPhone(string $phone): ?User
    {
        return User::where('phone', $phone)->first();
    }

    public function findById(int $id): ?User
    {
        return User::find($id);
    }

    public function registerUser(array $data): User
    {
        try {
            $user = new User();
            $user->name = trim($data['name']);
            $user->email = trim($data['email']);
            $user->phone = trim($data['phone']);
            $user->address = trim($data['address']);
            $user->password = $data['password']; // Already hashed
            $user->status_id = $data['status_id'] ?? 1;
            $user->role = $data['role'] ?? 'student';
            $user->class_id = $data['class_id'] ?? null;
            $user->faculty_id = $data['faculty_id'] ?? null;
            $user->ban_reason = $data['ban_reason'] ?? null;
            $user->point = $data['point'] ?? 0;
            $user->email_verified_at = null;
            $user->avatar = $data['avatar'] ?? 'default.png';

            $user->save();
            $user->refresh();

            return $user;
        } catch (\Illuminate\Database\QueryException $e) {
            // Handle specific database constraint violations
            if (str_contains($e->getMessage(), 'users_email_unique')) {
                throw new \Illuminate\Validation\ValidationException(
                    \Illuminate\Validation\Validator::make([], []),
                    ['email' => ['Email đã được đăng ký']]
                );
            }
            if (str_contains($e->getMessage(), 'users_phone_unique')) {
                throw new \Illuminate\Validation\ValidationException(
                    \Illuminate\Validation\Validator::make([], []),
                    ['phone' => ['Số điện thoại đã được đăng ký']]
                );
            }

            // Re-throw other database errors
            throw $e;
        }
    }

}
?>
