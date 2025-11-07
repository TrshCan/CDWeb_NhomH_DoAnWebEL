<?php

namespace App\Services;

use App\Repositories\StateManagementRepository;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Carbon\Carbon;

class StateManagementService
{
    protected $repository;

    public function __construct(StateManagementRepository $repository)
    {
        $this->repository = $repository;
    }

    /**
     * Thay đổi trạng thái khảo sát
     */
    public function changeStatus($id, string $newStatus)
    {
        $allowed = ['pending', 'active', 'paused', 'closed'];
        if (!in_array($newStatus, $allowed)) {
            throw ValidationException::withMessages(['status' => 'Trạng thái không hợp lệ.']);
        }

        $user = Auth::user();
        if (!$user || !in_array($user->role, ['admin', 'lecturer'])) {
            throw ValidationException::withMessages(['auth' => 'Bạn không có quyền thay đổi trạng thái.']);
        }

        $survey = $this->repository->find($id);

        // Quyền: admin hoặc người tạo
        if ($user->role !== 'admin' && $survey->created_by !== $user->id) {
            throw ValidationException::withMessages(['auth' => 'Bạn chỉ có thể chỉnh sửa khảo sát của mình.']);
        }

        if ($survey->status === $newStatus) {
            throw ValidationException::withMessages(['status' => 'Khảo sát đã ở trạng thái này.']);
        }

        $now = Carbon::now();
        $startAt = $survey->start_at ? Carbon::parse($survey->start_at) : null;
        $endAt = $survey->end_at ? Carbon::parse($survey->end_at) : null;

        $this->validateTransition($survey->status, $newStatus, $now, $startAt, $endAt);

        $survey = $this->repository->updateStatus($id, $newStatus);

        $message = match ($newStatus) {
            'active' => 'Khảo sát đã được kích hoạt.',
            'paused' => 'Khảo sát đã được tạm dừng.',
            'closed' => 'Khảo sát đã được đóng.',
            default => 'Cập nhật trạng thái thành công.'
        };

        return compact('survey', 'message');
    }

    protected function validateTransition($current, $newStatus, $now, $startAt, $endAt)
    {
        return match ($current) {
            'pending' => $this->fromPending($newStatus, $now, $startAt),
            'active'  => $this->fromActive($newStatus, $now, $endAt),
            'paused'  => $this->fromPaused($newStatus),
            'closed'  => throw ValidationException::withMessages(['status' => 'Khảo sát đã đóng, không thể thay đổi.']),
            default   => throw ValidationException::withMessages(['status' => 'Trạng thái hiện tại không hợp lệ.']),
        };
    }

    private function fromPending($newStatus, $now, $startAt)
    {
        if ($newStatus !== 'active') {
            throw ValidationException::withMessages(['status' => 'Chỉ có thể chuyển từ "Chưa bắt đầu" sang "Đang hoạt động".']);
        }
        if ($startAt && $now->lt($startAt)) {
            throw ValidationException::withMessages(['status' => 'Chưa đến thời gian bắt đầu.']);
        }
    }

    private function fromActive($newStatus, $now, $endAt)
    {
        if (!in_array($newStatus, ['paused', 'closed'])) {
            throw ValidationException::withMessages(['status' => 'Chỉ có thể chuyển sang "Tạm dừng" hoặc "Đóng".']);
        }
        // Tùy chọn: có cho đóng sớm không?
        // if ($newStatus === 'closed' && $endAt && $now->lt($endAt)) {
        //     throw ValidationException::withMessages(['status' => 'Chưa đến thời gian kết thúc.']);
        // }
    }

    private function fromPaused($newStatus)
    {
        if (!in_array($newStatus, ['active', 'closed'])) {
            throw ValidationException::withMessages(['status' => 'Chỉ có thể chuyển sang "Tiếp tục" hoặc "Đóng".']);
        }
    }

    /**
     * Bật/tắt xem lại kết quả
     */
    public function toggleReviewPermission($id, bool $allowReview)
    {
        $user = Auth::user();
        if (!$user || !in_array($user->role, ['admin', 'lecturer'])) {
            throw ValidationException::withMessages(['auth' => 'Không có quyền.']);
        }

        $survey = $this->repository->find($id);

        if ($user->role !== 'admin' && $survey->created_by !== $user->id) {
            throw ValidationException::withMessages(['auth' => 'Chỉ chủ khảo sát mới được thay đổi.']);
        }

        $survey = $this->repository->updateReviewPermission($id, $allowReview);

        return [
            'survey' => $survey,
            'message' => $allowReview
                ? 'Đã bật xem lại kết quả.'
                : 'Đã tắt xem lại kết quả.'
        ];
    }

    /**
     * Tính trạng thái thực tế (dùng để hiển thị)
     */
    public function getComputedStatus($survey)
    {
        $now = Carbon::now();
        $startAt = $survey->start_at;
        $endAt = $survey->end_at;

        if ($survey->status === 'closed' || ($endAt && $now->gt($endAt))) {
            return 'closed';
        }

        if ($survey->status === 'paused') {
            return 'paused';
        }

        if ($startAt && $now->lt($startAt)) {
            return 'pending';
        }

        if ($survey->status === 'active' && (!$endAt || $now->lte($endAt))) {
            return 'active';
        }

        return $survey->status;
    }

    /**
     * Đồng bộ trạng thái tính toán vào DB (gọi định kỳ nếu cần)
     */
    public function syncStatus($survey)
    {
        $computed = $this->getComputedStatus($survey);
        if ($survey->status !== $computed) {
            $survey->status = $computed;
            $survey->save();
        }
        return $survey;
    }
}