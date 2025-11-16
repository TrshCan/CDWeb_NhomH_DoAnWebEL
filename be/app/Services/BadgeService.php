<?php

namespace App\Services;

use App\Repositories\BadgeRepository;
use Illuminate\Support\Facades\Validator;
use GraphQL\Error\UserError;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class BadgeService
{
    public function __construct(private BadgeRepository $badgeRepo)
    {
    }

    /**
     * Lấy danh sách badge với phân trang và sắp xếp
     */
    public function getBadges(int $page = 1, int $perPage = 10, string $sortBy = 'id', string $sortOrder = 'asc')
    {
        return $this->badgeRepo->getBadges($page, $perPage, $sortBy, $sortOrder);
    }

    /**
     * Lấy thông tin một badge
     */
    public function getBadge(int $id)
    {
        $badge = $this->badgeRepo->getBadge($id);
        if (!$badge) {
            throw new UserError('Không tìm thấy Badge');
        }
        return $badge;
    }

    /**
     * Tạo badge mới
     */
    public function createBadge(array $data)
    {
        // Validation
        $validator = Validator::make($data, [
            'name' => ['required', 'string', 'max:255', 'unique:badges,name'],
            'description' => ['nullable', 'string', 'max:255'],
        ], [
            'name.required' => 'Tên và mô tả không được để trống',
            'name.max' => 'Vui lòng nhập tên ít hơn 255 kí tự',
            'name.unique' => 'Tên Badge đã tồn tại',
            'description.max' => 'Vui lòng nhập mô tả ít hơn 255 kí tự',
        ]);

        if ($validator->fails()) {
            $messages = $validator->errors()->all();
            throw new UserError(implode(' | ', $messages));
        }

        return $this->badgeRepo->createBadge($data);
    }

    /**
     * Cập nhật thông tin badge
     */
    public function updateBadge(int $id, array $data)
    {
        // Validation
        $validator = Validator::make($data, [
            'name' => ['nullable', 'string', 'max:255', Rule::unique('badges', 'name')->ignore($id)],
            'description' => ['nullable', 'string', 'max:255'],
        ], [
            'name.max' => 'Vui lòng nhập tên ít hơn 255 kí tự',
            'name.unique' => 'Tên Badge đã tồn tại',
            'description.max' => 'Vui lòng nhập mô tả ít hơn 255 kí tự',
        ]);

        if ($validator->fails()) {
            $messages = $validator->errors()->all();
            throw new UserError(implode(' | ', $messages));
        }

        return $this->badgeRepo->updateBadge($id, $data);
    }

    /**
     * Xóa badge
     */
    public function deleteBadge(int $id)
    {
        $badge = $this->badgeRepo->getBadge($id);
        if (!$badge) {
            throw new UserError('Không tìm thấy Badge');
        }

        // Kiểm tra số user đã nhận badge
        $userCount = $this->badgeRepo->getBadgeUserCount($id);
        if ($userCount > 0) {
            // Vẫn cho phép xóa nhưng sẽ xóa cả user_badges
        }

        return $this->badgeRepo->deleteBadge($id);
    }

    /**
     * Cấp badge cho user
     */
    public function assignBadge(int $badgeId, int $userId, ?int $assignedBy = null)
    {
        // Nếu không có assignedBy được truyền vào, thử lấy từ auth
        if (!$assignedBy) {
            $assignedBy = auth()->id() ?? auth('web')->id() ?? Auth::id();
            
            // Nếu vẫn không có, thử lấy từ request
            if (!$assignedBy && request()->user()) {
                $assignedBy = request()->user()->id;
            }
        }
        
        if (!$assignedBy) {
            \Log::error('Cannot get assigned_by', [
                'auth_id' => auth()->id(),
                'auth_web_id' => auth('web')->id(),
                'Auth_id' => Auth::id(),
                'request_user' => request()->user()?->id,
            ]);
            throw new UserError('Không xác định được người cấp. Vui lòng đăng nhập lại.');
        }

        return $this->badgeRepo->assignBadge($badgeId, $userId, $assignedBy);
    }

    /**
     * Thu hồi badge từ user
     */
    public function revokeBadge(int $badgeId, int $userId)
    {
        return $this->badgeRepo->revokeBadge($badgeId, $userId);
    }

    /**
     * Lấy danh sách user đã nhận badge
     */
    public function getBadgeUsers(int $badgeId)
    {
        return $this->badgeRepo->getBadgeUsers($badgeId);
    }

    /**
     * Đếm số user đã nhận badge
     */
    public function getBadgeUserCount(int $badgeId)
    {
        return $this->badgeRepo->getBadgeUserCount($badgeId);
    }
}

