<?php
namespace App\GraphQL\Mutations;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UserMutation
{
    public function loginUser($_, array $args)
    {
        $user = User::where('email', $args['email'])->first();

        if (!$user) {
            throw new \GraphQL\Error\Error("Email không tồn tại");
        }

        if (!Hash::check($args['password'], $user->password)) {
            throw new \GraphQL\Error\Error("Mật khẩu không đúng");
        }

        // Tạo token đơn giản (hoặc JWT)
        $token = Str::random(60);

        // Nếu dùng Passport/Sanctum bạn có thể tạo token ở đây
        // $token = $user->createToken('auth_token')->plainTextToken;

        return [
            'token' => $token,
            'user' => $user,
        ];
    }
}

?>
