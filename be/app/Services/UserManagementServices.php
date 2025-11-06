<?php

namespace App\Services;

use App\Repositories\UserManagementRepo;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;

class UserManagementServices
{


    public function __construct(private UserManagementRepo $UserManagementRepo)
    {

    }

    /**
     * Lấy trang cá nhân công khai theo ID
     */

    /**
     * Cập nhật hồ sơ người dùng đã đăng nhập
     */
    public function updateProfile(array $data)
    {
        // Lấy userId từ args thay vì từ Auth
        $userId = $data['user_id'] ?? null;

        if (!$userId) {
            throw new \Exception('Thiếu thông tin user_id');
        }

        // Kiểm tra user có tồn tại không
        $user = \App\Models\User::find($userId);
        if (!$user) {
            throw new \Exception('Không tìm thấy người dùng');
        }

        Log::info('UserManagementServices: Updating profile', [
            'user_id' => $userId,
            'email' => $data['email'] ?? 'not provided',
            'current_user_email' => $user->email,
        ]);

        $validator = Validator::make($data, [
            'name' => ['required', 'string', 'min:10', 'max:50', 'regex:/^[\pL\s]+$/u'],
            'email' => [
                'required',
                'email',
                Rule::unique('users', 'email')->ignore($userId, 'id')
            ],
            'address' => ['nullable', 'string', 'max:255'],
            'password' => ['nullable', 'string', 'min:8',
                'regex:/[A-Z]/',   // chữ hoa
                'regex:/[a-z]/',   // chữ thường
                'regex:/[0-9]/',   // số
                'regex:/[^A-Za-z0-9]/' // ký tự đặc biệt
            ],
            'password_confirmation' => ['same:password'],
            'avatar' => ['nullable', 'image', 'mimes:jpg,png,jpeg,gif', 'max:2048']
        ], [
            'name.required' => 'Vui lòng không bỏ trống họ tên',
            'name.min' => 'Họ tên phải từ 10 ký tự trở lên',
            'name.max' => 'Họ tên không được quá 50 ký tự',
            'name.regex' => 'Vui lòng không dùng các ký tự đặc biệt!',
            'email.required' => 'Vui lòng nhập email',
            'email.email' => 'Email không hợp lệ',
            'email.unique' => 'Email đã được đăng ký',
            'address.max' => 'Địa chỉ không được quá 255 ký tự',
            'password.min' => 'Mật khẩu phải có ít nhất 8 ký tự',
            'password.regex' => 'Mật khẩu phải có chữ hoa, chữ thường, số và ký tự đặc biệt',
            'password_confirmation.same' => 'Xác nhận mật khẩu không trùng khớp',
            'avatar.image' => 'Ảnh đại diện phải là hình ảnh',
            'avatar.max' => 'Ảnh đại diện không được vượt quá 2MB',
        ]);

        if ($validator->fails()) {
            throw new ValidationException($validator);
        }

        return $this->UserManagementRepo->updateProfile($userId, $data);
    }

}
