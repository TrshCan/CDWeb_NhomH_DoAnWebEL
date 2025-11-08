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

        // Tự động sync status trước khi thực hiện thay đổi (tự động đóng nếu quá ngày kết thúc)
        $survey = $this->syncStatus($survey);

        // // Quyền: admin hoặc người tạo
        // if ($user->role !== 'admin' && $survey->created_by !== $user->id) {
        //     throw ValidationException::withMessages(['auth' => 'Bạn chỉ có thể chỉnh sửa khảo sát của mình.']);
        // }

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

        // Tự động sync status trước khi thực hiện thay đổi (tự động đóng nếu quá ngày kết thúc)
        $survey = $this->syncStatus($survey);

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
     * Tự động đóng nếu quá ngày kết thúc
     */
    public function getComputedStatus($survey)
    {
        $now = Carbon::now();
        $startAt = $survey->start_at ? Carbon::parse($survey->start_at) : null;
        $endAt = $survey->end_at ? Carbon::parse($survey->end_at) : null;

        // Ưu tiên 1: Nếu đã quá ngày kết thúc, tự động đóng (bất kể status hiện tại)
        if ($endAt && $now->gt($endAt)) {
            return 'closed';
        }

        // Ưu tiên 2: Nếu đã đóng thủ công, giữ nguyên
        if ($survey->status === 'closed') {
            return 'closed';
        }

        // Ưu tiên 3: Nếu đang tạm dừng, giữ nguyên (trừ khi quá ngày kết thúc - đã xử lý ở trên)
        if ($survey->status === 'paused') {
            return 'paused';
        }

        // Ưu tiên 4: Nếu chưa đến thời gian bắt đầu
        if ($startAt && $now->lt($startAt)) {
            return 'pending';
        }

        // Ưu tiên 5: Nếu đang active và trong khoảng thời gian
        if ($survey->status === 'active' && (!$endAt || $now->lte($endAt))) {
            return 'active';
        }

        // Mặc định: trả về status hiện tại
        return $survey->status;
    }

    /**
     * Đồng bộ trạng thái tính toán vào DB
     * Tự động đóng survey nếu đã quá ngày kết thúc
     */
    public function syncStatus($survey)
    {
        $computed = $this->getComputedStatus($survey);
        if ($survey->status !== $computed) {
            // Tự động cập nhật status nếu khác với status hiện tại
            // Đặc biệt: tự động đóng nếu quá ngày kết thúc
            $survey->status = $computed;
            $survey->save();
        }
        // Trả về fresh instance để đảm bảo có dữ liệu mới nhất
        return $survey->fresh();
    }
}