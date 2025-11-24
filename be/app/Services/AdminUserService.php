<?php

namespace App\Services;

use App\Repositories\AdminUserRepository;
use Illuminate\Support\Facades\Validator;
use GraphQL\Error\UserError;
use Illuminate\Validation\Rule;

class AdminUserService
{
    public function __construct(private AdminUserRepository $adminUserRepo)
    {
    }

    /**
     * Lấy danh sách người dùng với phân trang và sắp xếp
     */
    public function getUsers(int $page = 1, int $perPage = 5, string $sortBy = 'id', string $sortOrder = 'asc')
    {
        return $this->adminUserRepo->getUsers($page, $perPage, $sortBy, $sortOrder);
    }

    /**
     * Lấy thông tin một người dùng
     */
    public function getUser(int $id)
    {
        $user = $this->adminUserRepo->getUser($id);
        if (!$user) {
            throw new UserError('Không tìm thấy người dùng');
        }
        return $user;
    }

    /**
     * Tạo người dùng mới
     */
    public function createUser(array $data)
    {
        // Validation
        $validator = Validator::make($data, [
            'name' => ['required', 'string', 'min:10', 'max:50', 'regex:/^[\pL\s]+$/u'],
            'email' => ['required', 'email', 'unique:users,email'],
            'password' => [
                'required',
                'string',
                'min:8',
                'regex:/[A-Z]/',
                'regex:/[a-z]/',
                'regex:/[0-9]/',
                'regex:/[^A-Za-z0-9]/'
            ],
            'role' => ['nullable', 'string', 'in:admin,lecturer,student'],
            'status_id' => ['nullable', 'integer', 'exists:statuses,id'],
        ], [
            'name.required' => 'Vui lòng không bỏ trống họ tên',
            'name.min' => 'Họ tên phải từ 10 ký tự trở lên',
            'name.max' => 'Họ tên không được quá 50 ký tự',
            'name.regex' => 'Vui lòng không dùng các ký tự đặc biệt',
            'email.required' => 'Vui lòng nhập email',
            'email.email' => 'Email không hợp lệ',
            'email.unique' => 'Email đã được đăng ký',
            'password.required' => 'Vui lòng nhập mật khẩu',
            'password.min' => 'Mật khẩu phải có ít nhất 8 ký tự',
            'password.regex' => 'Mật khẩu phải có chữ hoa, chữ thường, số và ký tự đặc biệt',
            'role.in' => 'Vai trò không hợp lệ',
            'status_id.exists' => 'Trạng thái không tồn tại',
        ]);

        if ($validator->fails()) {
            $messages = $validator->errors()->all();
            throw new UserError(implode(' | ', $messages));
        }

        return $this->adminUserRepo->createUser($data);
    }

    /**
     * Cập nhật thông tin người dùng
     */
    public function updateUser(int $id, array $data)
    {
        // Validation
        $validator = Validator::make($data, [
            'name' => ['nullable', 'string', 'min:10', 'max:50', 'regex:/^[\pL\s]+$/u'],
            'email' => ['nullable', 'email', Rule::unique('users', 'email')->ignore($id)],
            'role' => ['nullable', 'string', 'in:admin,lecturer,student'],
            'status_id' => ['nullable', 'integer', 'exists:statuses,id'],
        ], [
            'name.min' => 'Họ tên phải từ 10 ký tự trở lên',
            'name.max' => 'Họ tên không được quá 50 ký tự',
            'name.regex' => 'Vui lòng không dùng các ký tự đặc biệt',
            'email.email' => 'Email không hợp lệ',
            'email.unique' => 'Email đã được đăng ký',
            'role.in' => 'Vai trò không hợp lệ',
            'status_id.exists' => 'Trạng thái không tồn tại',
        ]);

        if ($validator->fails()) {
            $messages = $validator->errors()->all();
            throw new UserError(implode(' | ', $messages));
        }

        return $this->adminUserRepo->updateUser($id, $data);
    }

    /**
     * Xóa người dùng
     */
    public function deleteUser(int $id)
    {
        return $this->adminUserRepo->deleteUser($id);
    }

    /**
     * Chuyển đổi trạng thái người dùng
     */
    public function toggleUserStatus(int $id, ?string $ban_reason = null)
    {
        return $this->adminUserRepo->toggleUserStatus($id, $ban_reason);
    }
}

