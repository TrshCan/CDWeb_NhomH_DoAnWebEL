<?php

namespace App\Repositories;

use App\Models\User;
use App\Models\Status;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use GraphQL\Error\UserError;

class AdminUserRepository
{
    /**
     * Lấy danh sách người dùng với phân trang và sắp xếp
     */
    public function getUsers(int $page = 1, int $perPage = 5, string $sortBy = 'id', string $sortOrder = 'asc')
    {
        // Sắp xếp
        $allowedSortFields = ['id', 'name', 'created_at', 'role', 'status_id'];
        $sortBy = in_array($sortBy, $allowedSortFields) ? $sortBy : 'id';
        $sortOrder = strtolower($sortOrder) === 'desc' ? 'desc' : 'asc';

        // Xử lý sắp xếp theo status (cần join với bảng statuses)
        if ($sortBy === 'status_id') {
            $query = User::leftJoin('statuses', 'users.status_id', '=', 'statuses.id')
                  ->select('users.*')
                  ->with('status')
                  ->orderBy('statuses.name', $sortOrder)
                  ->orderBy('users.id', 'asc');
        } else {
            $query = User::with('status')->orderBy($sortBy, $sortOrder);
        }

        // Đếm tổng số (trước khi phân trang)
        $total = User::count();

        // Phân trang
        $offset = ($page - 1) * $perPage;
        $users = $query->skip($offset)->take($perPage)->get();

        $totalPages = ceil($total / $perPage);

        return [
            'data' => $users,
            'pagination' => [
                'currentPage' => $page,
                'perPage' => $perPage,
                'total' => $total,
                'totalPages' => $totalPages,
                'hasNextPage' => $page < $totalPages,
                'hasPrevPage' => $page > 1,
            ],
        ];
    }

    /**
     * Lấy thông tin một người dùng
     */
    public function getUser(int $id): ?User
    {
        return User::with('status')->find($id);
    }

    /**
     * Tạo người dùng mới
     */
    public function createUser(array $data): User
    {
        try {
            $user = new User();
            $user->name = trim($data['name']);
            $user->email = trim($data['email']);
            $user->password = Hash::make($data['password']);
            $user->role = $data['role'] ?? 'student';
            $user->status_id = $data['status_id'] ?? 1; // 1 = active (mặc định)
            $user->phone = $data['phone'] ?? null;
            $user->address = $data['address'] ?? null;
            $user->point = 0;
            $user->email_verified_at = null;
            $user->avatar = 'default.png';

            $user->save();
            $user->refresh();
            $user->load('status');

            return $user;
        } catch (\Illuminate\Database\QueryException $e) {
            if (str_contains($e->getMessage(), 'users_email_unique')) {
                throw new UserError('Email đã được đăng ký');
            }
            throw new UserError('Không thể tạo người dùng: ' . $e->getMessage());
        }
    }

    /**
     * Cập nhật thông tin người dùng
     */
    public function updateUser(int $id, array $data): User
    {
        $user = User::find($id);
        if (!$user) {
            throw new UserError('Không tìm thấy người dùng');
        }

        try {
            if (isset($data['name'])) {
                $user->name = trim($data['name']);
            }
            if (isset($data['email'])) {
                $user->email = trim($data['email']);
            }
            if (isset($data['role'])) {
                $user->role = $data['role'];
            }
            if (isset($data['status_id'])) {
                $user->status_id = $data['status_id'];
            }

            $user->save();
            $user->refresh();
            $user->load('status');

            return $user;
        } catch (\Illuminate\Database\QueryException $e) {
            if (str_contains($e->getMessage(), 'users_email_unique')) {
                throw new UserError('Email đã được đăng ký');
            }
            throw new UserError('Không thể cập nhật người dùng: ' . $e->getMessage());
        }
    }

    /**
     * Xóa người dùng
     */
    public function deleteUser(int $id): bool
    {
        $user = User::find($id);
        if (!$user) {
            throw new UserError('Không tìm thấy người dùng');
        }

        try {
            $user->delete();
            return true;
        } catch (\Exception $e) {
            throw new UserError('Không thể xóa người dùng: ' . $e->getMessage());
        }
    }

    /**
     * Chuyển đổi trạng thái người dùng (Active ↔ Banned)
     */
    public function toggleUserStatus(int $id, ?string $ban_reason = null): User
    {
        $user = User::find($id);
        if (!$user) {
            throw new UserError('Không tìm thấy người dùng');
        }

        // Tìm status active và banned
        $activeStatus = Status::where('name', 'active')->first();
        $bannedStatus = Status::where('name', 'banned')->first();

        if (!$activeStatus || !$bannedStatus) {
            throw new UserError('Không tìm thấy trạng thái trong hệ thống');
        }

        // Chuyển đổi trạng thái
        if ($user->status_id == $activeStatus->id) {
            // Đang ban user - yêu cầu ban_reason
            if (empty($ban_reason) || trim($ban_reason) === '') {
                throw new UserError('Vui lòng nhập lý do cấm tài khoản');
            }
            $user->status_id = $bannedStatus->id;
            $user->ban_reason = trim($ban_reason);
        } else {
            // Đang unban user - xóa ban_reason
            $user->status_id = $activeStatus->id;
            $user->ban_reason = null;
        }

        $user->save();
        $user->refresh();
        $user->load('status');

        return $user;
    }
}

