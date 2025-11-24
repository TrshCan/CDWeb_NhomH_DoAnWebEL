<?php

namespace App\Services;

use App\Repositories\UserManagementRepo;
use Illuminate\Support\Facades\Validator;
use GraphQL\Error\UserError;
use Illuminate\Validation\Rule;

class UserManagementServices
{
    public function __construct(private UserManagementRepo $UserManagementRepo) {}

    /**
     * Cập nhật hồ sơ người dùng
     */
    public function updateProfile(array $data)
    {
        $userId = $data['user_id'] ?? null;
        if (!$userId) {
            throw new UserError('Thiếu thông tin user_id');
        }

        $user = \App\Models\User::find($userId);
        if (!$user) {
            throw new UserError('Không tìm thấy người dùng');
        }

        // --- Validator ---
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
            // Lấy tất cả message và nối thành chuỗi
            $messages = $validator->errors()->all();
            throw new UserError(implode(" | ", $messages));
        }

        // Nếu muốn kiểm tra password hiện tại khi đổi mật khẩu
        if (!empty($data['password']) && !empty($data['current_password'])) {
            if (!\Illuminate\Support\Facades\Hash::check($data['current_password'], $user->password)) {
                throw new UserError("Mật khẩu hiện tại không đúng.");
            }
        } elseif (!empty($data['password'])) {
            throw new UserError("Vui lòng nhập mật khẩu hiện tại để đổi mật khẩu.");
        }

        // Gọi Repo để update
        return $this->UserManagementRepo->updateProfile($userId, $data);
    }
}
