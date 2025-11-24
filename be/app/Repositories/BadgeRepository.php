<?php

namespace App\Repositories;

use App\Models\Badge;
use App\Models\UserBadge;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use GraphQL\Error\UserError;

class BadgeRepository
{
    /**
     * Lấy danh sách badge với phân trang và sắp xếp
     */
    public function getBadges(int $page = 1, int $perPage = 10, string $sortBy = 'id', string $sortOrder = 'asc')
    {
        // Sắp xếp
        $allowedSortFields = ['id', 'name', 'created_at'];
        $sortBy = in_array($sortBy, $allowedSortFields) ? $sortBy : 'id';
        $sortOrder = strtolower($sortOrder) === 'desc' ? 'desc' : 'asc';

        $query = Badge::orderBy($sortBy, $sortOrder);

        // Đếm tổng số (trước khi phân trang)
        $total = Badge::count();

        // Phân trang
        $offset = ($page - 1) * $perPage;
        $badges = $query->skip($offset)->take($perPage)->get();

        $totalPages = ceil($total / $perPage);

        return [
            'data' => $badges,
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
     * Lấy thông tin một badge
     */
    public function getBadge(int $id): ?Badge
    {
        return Badge::find($id);
    }

    /**
     * Tạo badge mới
     */
    public function createBadge(array $data): Badge
    {
        try {
            $badge = new Badge();
            $badge->name = trim($data['name']);
            $badge->description = $data['description'] ? trim($data['description']) : null;
            $badge->save();
            $badge->refresh();

            return $badge;
        } catch (\Illuminate\Database\QueryException $e) {
            if (str_contains($e->getMessage(), 'badges_name_unique')) {
                throw new UserError('Tên Badge đã tồn tại');
            }
            throw new UserError('Không thể tạo Badge: ' . $e->getMessage());
        }
    }

    /**
     * Cập nhật thông tin badge
     */
    public function updateBadge(int $id, array $data): Badge
    {
        $badge = Badge::find($id);
        if (!$badge) {
            throw new UserError('Không tìm thấy Badge');
        }

        try {
            if (isset($data['name'])) {
                $badge->name = trim($data['name']);
            }
            if (isset($data['description'])) {
                $badge->description = $data['description'] ? trim($data['description']) : null;
            }

            $badge->save();
            $badge->refresh();

            return $badge;
        } catch (\Illuminate\Database\QueryException $e) {
            if (str_contains($e->getMessage(), 'badges_name_unique')) {
                throw new UserError('Tên Badge đã tồn tại');
            }
            throw new UserError('Không thể cập nhật Badge: ' . $e->getMessage());
        }
    }

    /**
     * Xóa badge
     */
    public function deleteBadge(int $id): bool
    {
        $badge = Badge::find($id);
        if (!$badge) {
            throw new UserError('Không tìm thấy Badge');
        }

        try {
            // Xóa tất cả user_badges liên quan
            UserBadge::where('badge_id', $id)->delete();
            
            // Xóa badge
            $badge->delete();
            return true;
        } catch (\Exception $e) {
            throw new UserError('Không thể xóa Badge: ' . $e->getMessage());
        }
    }

    /**
     * Cấp badge cho user
     */
    public function assignBadge(int $badgeId, int $userId, int $assignedBy): bool
    {
        $badge = Badge::find($badgeId);
        if (!$badge) {
            throw new UserError('Không tìm thấy Badge');
        }

        $user = User::find($userId);
        if (!$user) {
            throw new UserError('Không tìm thấy người dùng');
        }

        // Kiểm tra user đã có badge này chưa (và chưa bị thu hồi)
        $existing = UserBadge::where('user_id', $userId)
            ->where('badge_id', $badgeId)
            ->whereNull('revoked_at')
            ->first();

        if ($existing) {
            throw new UserError('User đã có Badge này');
        }

        try {
            // Thu hồi badge cũ nếu có (revoked_at không null)
            $revoked = UserBadge::where('user_id', $userId)
                ->where('badge_id', $badgeId)
                ->whereNotNull('revoked_at')
                ->first();

            if ($revoked) {
                // Cập nhật lại badge đã bị thu hồi
                $revoked->revoked_at = null;
                $revoked->assigned_at = now();
                $revoked->assigned_by = $assignedBy;
                $revoked->save();
            } else {
                // Tạo mới
                $userBadge = new UserBadge();
                $userBadge->user_id = $userId;
                $userBadge->badge_id = $badgeId;
                $userBadge->assigned_by = $assignedBy;
                $userBadge->assigned_at = now();
                $userBadge->save();
            }

            return true;
        } catch (\Exception $e) {
            throw new UserError('Không thể cấp Badge: ' . $e->getMessage());
        }
    }

    /**
     * Thu hồi badge từ user
     */
    public function revokeBadge(int $badgeId, int $userId): bool
    {
        $badge = Badge::find($badgeId);
        if (!$badge) {
            throw new UserError('Không tìm thấy Badge');
        }

        $user = User::find($userId);
        if (!$user) {
            throw new UserError('Không tìm thấy người dùng');
        }

        $userBadge = UserBadge::where('user_id', $userId)
            ->where('badge_id', $badgeId)
            ->whereNull('revoked_at')
            ->first();

        if (!$userBadge) {
            throw new UserError('User chưa nhận Badge này');
        }

        try {
            $userBadge->revoked_at = now();
            $userBadge->save();

            return true;
        } catch (\Exception $e) {
            throw new UserError('Không thể thu hồi Badge: ' . $e->getMessage());
        }
    }

    /**
     * Lấy danh sách user đã nhận badge
     */
    public function getBadgeUsers(int $badgeId): array
    {
        $userBadges = UserBadge::where('badge_id', $badgeId)
            ->whereNull('revoked_at')
            ->with(['user', 'assigner'])
            ->get();

        return $userBadges->map(function ($userBadge) {
            return [
                'user_id' => (string) $userBadge->user_id,
                'user_name' => $userBadge->user->name ?? '',
                'user_email' => $userBadge->user->email ?? '',
                'assigned_at' => $userBadge->assigned_at,
                'assigned_by' => $userBadge->assigned_by ? (string) $userBadge->assigned_by : null,
                'assigned_by_name' => $userBadge->assigner->name ?? null,
            ];
        })->toArray();
    }

    /**
     * Đếm số user đã nhận badge
     */
    public function getBadgeUserCount(int $badgeId): int
    {
        return UserBadge::where('badge_id', $badgeId)
            ->whereNull('revoked_at')
            ->count();
    }
}

