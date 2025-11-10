<?php

namespace App\Services;

use App\Repositories\StateManagementRepository;
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

        $survey = $this->repository->find($id);
        $originalStatus = $survey->status;
        $now = Carbon::now();

        // === 1. KÍCH HOẠT + CÓ time_limit + CÓ start_at → GHI ĐÈ end_at = start_at + time_limit ===
        if ($newStatus === 'active' && $survey->time_limit && $survey->time_limit > 0) {
            $startAt = $survey->start_at ? Carbon::parse($survey->start_at)->setTimezone($now->timezone) : null;
            
            // Chỉ tính end_at nếu có start_at: end_at = start_at + time_limit
            if ($startAt) {
                $calculatedEndAt = $startAt->copy()->addMinutes($survey->time_limit);
                
                if (!$survey->end_at || !$survey->end_at->eq($calculatedEndAt)) {
                    $survey->end_at = $calculatedEndAt;
                    \Log::info("Survey {$survey->id}: SET end_at = start_at + time_limit (manual activation)", [
                        'start_at' => $startAt->format('Y-m-d H:i:s'),
                        'time_limit' => $survey->time_limit,
                        'end_at' => $calculatedEndAt->format('Y-m-d H:i:s'),
                    ]);
                    $survey->save();
                    $survey = $survey->fresh();
                }
            }
            // Nếu không có start_at → không set end_at, dùng end_at ban đầu (nếu có)
        }

        // === 2. TỰ ĐỘNG SYNC TRẠNG THÁI ===
        $survey = $this->syncStatus($survey);

        // === 3. KIỂM TRA TRẠNG THÁI TRÙNG ===
        if ($survey->status === $newStatus) {
            if ($originalStatus !== $survey->status) {
                $message = match ($newStatus) {
                    'active' => 'Khảo sát đã được tự động kích hoạt.',
                    'closed' => 'Khảo sát đã được tự động đóng.',
                    default => 'Trạng thái đã được cập nhật.'
                };
                return compact('survey', 'message');
            }
            throw ValidationException::withMessages(['status' => 'Khảo sát đã ở trạng thái này.']);
        }

        $startAt = $survey->start_at ? Carbon::parse($survey->start_at)->setTimezone($now->timezone) : null;
        $endAt = $survey->end_at ? Carbon::parse($survey->end_at)->setTimezone($now->timezone) : null;

        // === 4. KIỂM TRA CHUYỂN TRẠNG THÁI ===
        $this->validateTransition($survey->status, $newStatus, $now, $startAt, $endAt, $survey);

        // === 5. LƯU TRẠNG THÁI MỚI ===
        $survey->status = $newStatus;
        $survey->save();
        $survey = $survey->fresh();

        $message = match ($newStatus) {
            'active' => 'Khảo sát đã được kích hoạt.',
            'paused' => 'Khảo sát đã được tạm dừng.',
            'closed' => 'Khảo sát đã được đóng.',
            default => 'Cập nhật trạng thái thành công.'
        };

        return compact('survey', 'message');
    }

    /**
     * Kiểm tra hợp lệ chuyển trạng thái
     */
    protected function validateTransition($current, $newStatus, $now, $startAt, $endAt, $survey)
    {
        return match ($current) {
            'pending' => $this->fromPending($newStatus, $now, $startAt),
            'active'  => $this->fromActive($newStatus, $now, $endAt, $survey),
            'paused'  => $this->fromPaused($newStatus),
            'closed' => throw ValidationException::withMessages(['status' => 'Khảo sát đã đóng, không thể thay đổi.']),
            default   => throw ValidationException::withMessages(['status' => 'Trạng thái hiện tại không hợp lệ.']),
        };
    }

    private function fromPending($newStatus, $now, $startAt)
    {
        if ($newStatus !== 'active') {
            throw ValidationException::withMessages(['status' => 'Chỉ có thể chuyển từ "Chưa bắt đầu" sang "Đang hoạt động".']);
        }

        if ($startAt && $now->lt($startAt)) {
            \Log::info("Survey được kích hoạt sớm", [
                'start_at' => $startAt->format('Y-m-d H:i:s'),
                'activated_at' => $now->format('Y-m-d H:i:s'),
            ]);
        }
    }

    private function fromActive($newStatus, $now, $endAt, $survey)
    {
        if (!in_array($newStatus, ['paused', 'closed'])) {
            throw ValidationException::withMessages(['status' => 'Chỉ có thể chuyển sang "Tạm dừng" hoặc "Đóng".']);
        }

        if ($newStatus === 'closed') {
            // Chỉ cấm đóng sớm nếu: KHÔNG CÓ time_limit + end_at chưa qua
            if (
                (!$survey->time_limit || $survey->time_limit <= 0) &&
                $endAt && 
                $now->lt($endAt)
            ) {
                throw ValidationException::withMessages(['status' => 'Chưa đến thời gian kết thúc.']);
            }
            // Nếu có time_limit → cho phép đóng sớm (hệ thống tự động đóng nếu quá)
        }
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
        $survey = $this->repository->find($id);
        $survey = $this->syncStatus($survey);
        $survey = $this->repository->updateReviewPermission($id, $allowReview);

        return [
            'survey' => $survey,
            'message' => $allowReview
                ? 'Đã bật xem lại kết quả.'
                : 'Đã tắt xem lại kết quả.'
        ];
    }

    /**
     * Tính trạng thái thực tế – ƯU TIÊN time_limit HOÀN TOÀN
     */
    public function getComputedStatus($survey)
    {
        $now = Carbon::now();
        $startAt = $survey->start_at ? Carbon::parse($survey->start_at)->setTimezone($now->timezone) : null;
        $endAt = $survey->end_at ? Carbon::parse($survey->end_at)->setTimezone($now->timezone) : null;

        // === 1. CÓ time_limit + CÓ start_at → KIỂM TRA end_at = start_at + time_limit ===
        if ($survey->time_limit && $survey->time_limit > 0 && $startAt) {
            // Tính end_at đúng từ start_at + time_limit
            $expectedEndAt = $startAt->copy()->addMinutes($survey->time_limit);
            
            // Chỉ đóng nếu:
            // - Có end_at và end_at đúng bằng start_at + time_limit
            // - Và đã quá thời gian end_at
            if ($endAt && $endAt->eq($expectedEndAt) && $now->gt($endAt) && in_array($survey->status, ['active', 'paused'])) {
                \Log::info("Survey {$survey->id}: AUTO-CLOSE by time_limit (start_at + time_limit = end_at)", [
                    'start_at' => $startAt->format('Y-m-d H:i:s'),
                    'time_limit' => $survey->time_limit,
                    'expected_end_at' => $expectedEndAt->format('Y-m-d H:i:s'),
                    'actual_end_at' => $endAt->format('Y-m-d H:i:s'),
                    'now' => $now->format('Y-m-d H:i:s'),
                ]);
                return 'closed';
            }
        }
        // Nếu có time_limit nhưng không có start_at → không tự động đóng bằng time_limit
        // === 2. KHÔNG CÓ time_limit → DÙNG end_at thủ công ===
        else if (!$survey->time_limit || $survey->time_limit <= 0) {
            if ($endAt && $now->gt($endAt) && in_array($survey->status, ['active', 'paused'])) {
                \Log::info("Survey {$survey->id}: AUTO-CLOSE by end_at", [
                    'end_at' => $endAt->format('Y-m-d H:i:s'),
                    'now' => $now->format('Y-m-d H:i:s'),
                ]);
                return 'closed';
            }
        }

        // === 3. TRẠNG THÁI CỐ ĐỊNH ===
        if ($survey->status === 'closed') return 'closed';
        if ($survey->status === 'paused') return 'paused';

        // === 4. TỰ ĐỘNG KÍCH HOẠT KHI ĐẾN start_at ===
        if ($survey->status === 'pending') {
            if (!$startAt || $now->gte($startAt)) {
                \Log::info("Survey {$survey->id}: AUTO-ACTIVATE by start_at", [
                    'start_at' => $startAt?->format('Y-m-d H:i:s') ?? 'null',
                    'now' => $now->format('Y-m-d H:i:s'),
                ]);
                return 'active';
            }
            return 'pending';
        }

        // === 5. ACTIVE ===
        if ($survey->status === 'active') {
            return 'active';
        }

        return $survey->status;
    }

    /**
     * Đồng bộ trạng thái vào DB
     */
    public function syncStatus($survey)
    {
        $oldStatus = $survey->status;
        $computed = $this->getComputedStatus($survey);
        $now = Carbon::now();
        $needsSave = false;

        // === TỰ ĐỘNG KÍCH HOẠT + CÓ time_limit + CÓ start_at → GHI ĐÈ end_at = start_at + time_limit ===
        if ($computed === 'active' && $oldStatus !== 'active' && $survey->time_limit && $survey->time_limit > 0) {
            $startAt = $survey->start_at ? Carbon::parse($survey->start_at)->setTimezone($now->timezone) : null;
            
            // Chỉ tính end_at nếu có start_at: end_at = start_at + time_limit
            if ($startAt) {
                $newEndAt = $startAt->copy()->addMinutes($survey->time_limit);
                
                if (!$survey->end_at || !$survey->end_at->eq($newEndAt)) {
                    $survey->end_at = $newEndAt;
                    $needsSave = true;
                    \Log::info("Survey {$survey->id}: AUTO SET end_at = start_at + time_limit", [
                        'start_at' => $startAt->format('Y-m-d H:i:s'),
                        'time_limit' => $survey->time_limit,
                        'end_at' => $newEndAt->format('Y-m-d H:i:s'),
                    ]);
                }
            }
            // Nếu không có start_at → không set end_at, dùng end_at ban đầu (nếu có)
        }

        // === CẬP NHẬT STATUS ===
        if ($survey->status !== $computed) {
            \Log::info("Survey {$survey->id}: STATUS SYNC", [
                'from' => $oldStatus,
                'to' => $computed,
            ]);
            $survey->status = $computed;
            $needsSave = true;
        }

        if ($needsSave) {
            $survey->save();
        }

        return $survey->fresh();
    }
}