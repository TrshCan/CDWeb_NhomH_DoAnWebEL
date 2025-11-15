<?php

namespace App\Services;

use App\Repositories\StateManagementRepository;
use Illuminate\Validation\ValidationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;
use Exception;

class StateManagementService
{
    protected $repository;

    public function __construct(StateManagementRepository $repository)
    {
        $this->repository = $repository;
    }

    /**
     * Thay đổi trạng thái khảo sát
     * 
     * @param int|string $id ID của survey
     * @param string $newStatus Trạng thái mới
     * @return array Mảng chứa 'survey' và 'message'
     * @throws ValidationException Khi trạng thái không hợp lệ hoặc không thể chuyển đổi
     * @throws ModelNotFoundException Khi không tìm thấy survey
     * @throws Exception Khi có lỗi database hoặc lỗi khác
     */
    public function changeStatus($id, string $newStatus)
    {
        try {
            // Validate input
            if (empty($id)) {
                throw ValidationException::withMessages(['id' => 'ID khảo sát là bắt buộc.']);
            }

            $allowed = ['pending', 'active', 'paused', 'closed'];
            if (!in_array($newStatus, $allowed)) {
                throw ValidationException::withMessages(['status' => 'Trạng thái không hợp lệ.']);
            }

            // Sử dụng database transaction để đảm bảo tính toàn vẹn
            return DB::transaction(function () use ($id, $newStatus) {
                $survey = $this->repository->find($id);
                
                // Kiểm tra survey có bị soft-deleted không
                if ($survey->trashed()) {
                    throw new Exception('Khảo sát đã bị xóa.', 404);
                }

                $originalStatus = $survey->status;
                $now = Carbon::now();

                // === 1. KÍCH HOẠT + CÓ time_limit + CÓ start_at → GHI ĐÈ end_at = start_at + time_limit ===
                if ($newStatus === 'active' && $survey->time_limit && $survey->time_limit > 0) {
                    try {
                        $startAt = $survey->start_at ? Carbon::parse($survey->start_at)->setTimezone($now->timezone) : null;
                        
                        // Chỉ tính end_at nếu có start_at: end_at = start_at + time_limit
                        if ($startAt) {
                            $calculatedEndAt = $startAt->copy()->addMinutes($survey->time_limit);
                            
                            if (!$survey->end_at || !$survey->end_at->eq($calculatedEndAt)) {
                                $survey->end_at = $calculatedEndAt;
                                Log::info("Survey {$survey->id}: SET end_at = start_at + time_limit (manual activation)", [
                                    'start_at' => $startAt->format('Y-m-d H:i:s'),
                                    'time_limit' => $survey->time_limit,
                                    'end_at' => $calculatedEndAt->format('Y-m-d H:i:s'),
                                ]);
                                
                                if (!$survey->save()) {
                                    throw new Exception('Không thể cập nhật thời gian kết thúc.', 500);
                                }
                                $survey = $survey->fresh();
                            }
                        }
                    } catch (\Exception $e) {
                        if ($e instanceof ValidationException || $e instanceof Exception) {
                            throw $e;
                        }
                        Log::error("Survey {$survey->id}: Lỗi parse date khi kích hoạt", [
                            'error' => $e->getMessage(),
                            'start_at' => $survey->start_at,
                            'trace' => $e->getTraceAsString()
                        ]);
                        throw new Exception('Lỗi xử lý thời gian: ' . $e->getMessage(), 500);
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

                // Parse dates với error handling
                try {
                    $startAt = $survey->start_at ? Carbon::parse($survey->start_at)->setTimezone($now->timezone) : null;
                    $endAt = $survey->end_at ? Carbon::parse($survey->end_at)->setTimezone($now->timezone) : null;
                } catch (\Exception $e) {
                    Log::error("Survey {$survey->id}: Lỗi parse date", [
                        'error' => $e->getMessage(),
                        'start_at' => $survey->start_at,
                        'end_at' => $survey->end_at,
                        'trace' => $e->getTraceAsString()
                    ]);
                    throw new Exception('Lỗi xử lý thời gian khảo sát.', 500);
                }

                // === 4. KIỂM TRA CHUYỂN TRẠNG THÁI ===
                $this->validateTransition($survey->status, $newStatus, $now, $startAt, $endAt, $survey);

                // === 5. LƯU TRẠNG THÁI MỚI ===
                $survey->status = $newStatus;
                
                if (!$survey->save()) {
                    throw new Exception('Không thể cập nhật trạng thái khảo sát.', 500);
                }
                
                $survey = $survey->fresh();
                if (!$survey) {
                    throw new Exception('Không thể tải lại thông tin khảo sát sau khi cập nhật.', 500);
                }

                $message = match ($newStatus) {
                    'active' => 'Khảo sát đã được kích hoạt.',
                    'paused' => 'Khảo sát đã được tạm dừng.',
                    'closed' => 'Khảo sát đã được đóng.',
                    default => 'Cập nhật trạng thái thành công.'
                };

                return compact('survey', 'message');
            });

        } catch (ModelNotFoundException $e) {
            Log::warning('Không tìm thấy survey để thay đổi trạng thái', [
                'id' => $id,
                'new_status' => $newStatus
            ]);
            throw new Exception('Khảo sát không tồn tại.', 404);
        } catch (ValidationException $e) {
            // Re-throw ValidationException để giữ nguyên message
            throw $e;
        } catch (QueryException $e) {
            Log::error('Lỗi database khi thay đổi trạng thái survey', [
                'id' => $id,
                'new_status' => $newStatus,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            // Kiểm tra các lỗi database phổ biến
            if (str_contains($e->getMessage(), 'foreign key constraint')) {
                throw new Exception('Khảo sát đang được sử dụng, không thể thay đổi trạng thái.', 422);
            }
            
            throw new Exception('Lỗi cơ sở dữ liệu khi cập nhật trạng thái.', 500);
        } catch (Exception $e) {
            // Nếu đã có code và message rõ ràng, throw lại
            if ($e->getCode() >= 400 && $e->getCode() < 600) {
                throw $e;
            }
            
            Log::error('Lỗi không xác định khi thay đổi trạng thái survey', [
                'id' => $id,
                'new_status' => $newStatus,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            throw new Exception('Không thể thay đổi trạng thái khảo sát: ' . $e->getMessage(), 500);
        }
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

        try {
            if ($startAt && $now->lt($startAt)) {
                Log::info("Survey được kích hoạt sớm", [
                    'start_at' => $startAt->format('Y-m-d H:i:s'),
                    'activated_at' => $now->format('Y-m-d H:i:s'),
                ]);
            }
        } catch (\Exception $e) {
            Log::warning("Lỗi so sánh start_at trong fromPending", [
                'error' => $e->getMessage(),
                'start_at' => $startAt?->format('Y-m-d H:i:s')
            ]);
            // Tiếp tục cho phép chuyển trạng thái dù có lỗi so sánh
        }
    }

    private function fromActive($newStatus, $now, $endAt, $survey)
    {
        if (!in_array($newStatus, ['paused', 'closed'])) {
            throw ValidationException::withMessages(['status' => 'Chỉ có thể chuyển sang "Tạm dừng" hoặc "Đóng".']);
        }

        if ($newStatus === 'closed') {
            try {
                // Chỉ cấm đóng sớm nếu: KHÔNG CÓ time_limit + end_at chưa qua
                if (
                    (!$survey->time_limit || $survey->time_limit <= 0) &&
                    $endAt && 
                    $now->lt($endAt)
                ) {
                    throw ValidationException::withMessages(['status' => 'Chưa đến thời gian kết thúc.']);
                }
                // Nếu có time_limit → cho phép đóng sớm (hệ thống tự động đóng nếu quá)
            } catch (ValidationException $e) {
                // Re-throw ValidationException
                throw $e;
            } catch (\Exception $e) {
                Log::warning("Lỗi so sánh end_at trong fromActive", [
                    'error' => $e->getMessage(),
                    'end_at' => $endAt?->format('Y-m-d H:i:s'),
                    'survey_id' => $survey->id ?? null
                ]);
                // Cho phép đóng nếu có lỗi so sánh (an toàn hơn)
            }
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
     * 
     * @param int|string $id ID của survey
     * @param bool $allowReview Cho phép xem lại hay không
     * @return array Mảng chứa 'survey' và 'message'
     * @throws ModelNotFoundException Khi không tìm thấy survey
     * @throws Exception Khi có lỗi database hoặc lỗi khác
     */
    public function toggleReviewPermission($id, bool $allowReview)
    {
        try {
            // Validate input
            if (empty($id)) {
                throw ValidationException::withMessages(['id' => 'ID khảo sát là bắt buộc.']);
            }

            // Sử dụng database transaction
            return DB::transaction(function () use ($id, $allowReview) {
                $survey = $this->repository->find($id);
                
                // Kiểm tra survey có bị soft-deleted không
                if ($survey->trashed()) {
                    throw new Exception('Khảo sát đã bị xóa.', 404);
                }

                $survey = $this->syncStatus($survey);
                $survey = $this->repository->updateReviewPermission($id, $allowReview);

                if (!$survey) {
                    throw new Exception('Không thể cập nhật quyền xem lại kết quả.', 500);
                }

                return [
                    'survey' => $survey,
                    'message' => $allowReview
                        ? 'Đã bật xem lại kết quả.'
                        : 'Đã tắt xem lại kết quả.'
                ];
            });

        } catch (ModelNotFoundException $e) {
            Log::warning('Không tìm thấy survey để cập nhật quyền xem lại', [
                'id' => $id,
                'allow_review' => $allowReview
            ]);
            throw new Exception('Khảo sát không tồn tại.', 404);
        } catch (QueryException $e) {
            Log::error('Lỗi database khi cập nhật quyền xem lại', [
                'id' => $id,
                'allow_review' => $allowReview,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            throw new Exception('Lỗi cơ sở dữ liệu khi cập nhật quyền xem lại.', 500);
        } catch (Exception $e) {
            // Nếu đã có code và message rõ ràng, throw lại
            if ($e->getCode() >= 400 && $e->getCode() < 600) {
                throw $e;
            }
            
            Log::error('Lỗi không xác định khi cập nhật quyền xem lại', [
                'id' => $id,
                'allow_review' => $allowReview,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            throw new Exception('Không thể cập nhật quyền xem lại kết quả: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Tính trạng thái thực tế – ƯU TIÊN time_limit HOÀN TOÀN
     * 
     * @param \App\Models\Survey $survey Survey cần tính trạng thái
     * @return string Trạng thái đã tính toán
     * @throws Exception Khi có lỗi parse date hoặc lỗi khác
     */
    public function getComputedStatus($survey)
    {
        if (!$survey) {
            throw new Exception('Survey không hợp lệ.', 400);
        }

        $now = Carbon::now();
        
        // Parse dates với error handling
        try {
            $startAt = $survey->start_at ? Carbon::parse($survey->start_at)->setTimezone($now->timezone) : null;
            $endAt = $survey->end_at ? Carbon::parse($survey->end_at)->setTimezone($now->timezone) : null;
        } catch (\Exception $e) {
            Log::warning("Survey {$survey->id}: Lỗi parse date trong getComputedStatus", [
                'error' => $e->getMessage(),
                'start_at' => $survey->start_at,
                'end_at' => $survey->end_at
            ]);
            // Nếu không parse được date, trả về trạng thái hiện tại
            return $survey->status ?? 'pending';
        }

        // === 1. CÓ time_limit + CÓ start_at → KIỂM TRA end_at = start_at + time_limit ===
        if ($survey->time_limit && $survey->time_limit > 0 && $startAt) {
            try {
                // Tính end_at đúng từ start_at + time_limit
                $expectedEndAt = $startAt->copy()->addMinutes($survey->time_limit);
                
                // Chỉ đóng nếu:
                // - Có end_at và end_at đúng bằng start_at + time_limit
                // - Và đã quá thời gian end_at
                if ($endAt && $endAt->eq($expectedEndAt) && $now->gt($endAt) && in_array($survey->status, ['active', 'paused'])) {
                    Log::info("Survey {$survey->id}: AUTO-CLOSE by time_limit (start_at + time_limit = end_at)", [
                        'start_at' => $startAt->format('Y-m-d H:i:s'),
                        'time_limit' => $survey->time_limit,
                        'expected_end_at' => $expectedEndAt->format('Y-m-d H:i:s'),
                        'actual_end_at' => $endAt->format('Y-m-d H:i:s'),
                        'now' => $now->format('Y-m-d H:i:s'),
                    ]);
                    return 'closed';
                }
            } catch (\Exception $e) {
                Log::warning("Survey {$survey->id}: Lỗi tính toán end_at từ time_limit", [
                    'error' => $e->getMessage(),
                    'time_limit' => $survey->time_limit,
                    'start_at' => $startAt?->format('Y-m-d H:i:s')
                ]);
                // Tiếp tục xử lý với logic khác
            }
        }
        // Nếu có time_limit nhưng không có start_at → không tự động đóng bằng time_limit
        // === 2. KHÔNG CÓ time_limit → DÙNG end_at thủ công ===
        else if (!$survey->time_limit || $survey->time_limit <= 0) {
            try {
                if ($endAt && $now->gt($endAt) && in_array($survey->status, ['active', 'paused'])) {
                    Log::info("Survey {$survey->id}: AUTO-CLOSE by end_at", [
                        'end_at' => $endAt->format('Y-m-d H:i:s'),
                        'now' => $now->format('Y-m-d H:i:s'),
                    ]);
                    return 'closed';
                }
            } catch (\Exception $e) {
                Log::warning("Survey {$survey->id}: Lỗi so sánh end_at", [
                    'error' => $e->getMessage(),
                    'end_at' => $endAt?->format('Y-m-d H:i:s')
                ]);
            }
        }

        // === 3. TRẠNG THÁI CỐ ĐỊNH ===
        if ($survey->status === 'closed') return 'closed';
        if ($survey->status === 'paused') return 'paused';

        // === 4. TỰ ĐỘNG KÍCH HOẠT KHI ĐẾN start_at ===
        if ($survey->status === 'pending') {
            try {
                if (!$startAt || $now->gte($startAt)) {
                    Log::info("Survey {$survey->id}: AUTO-ACTIVATE by start_at", [
                        'start_at' => $startAt?->format('Y-m-d H:i:s') ?? 'null',
                        'now' => $now->format('Y-m-d H:i:s'),
                    ]);
                    return 'active';
                }
            } catch (\Exception $e) {
                Log::warning("Survey {$survey->id}: Lỗi so sánh start_at", [
                    'error' => $e->getMessage(),
                    'start_at' => $startAt?->format('Y-m-d H:i:s')
                ]);
            }
            return 'pending';
        }

        // === 5. ACTIVE ===
        if ($survey->status === 'active') {
            return 'active';
        }

        // Trả về trạng thái hiện tại nếu không match với bất kỳ điều kiện nào
        return $survey->status ?? 'pending';
    }

    /**
     * Đồng bộ trạng thái vào DB
     * 
     * @param \App\Models\Survey $survey Survey cần đồng bộ trạng thái
     * @return \App\Models\Survey Survey đã được cập nhật
     * @throws Exception Khi có lỗi parse date hoặc lỗi database
     */
    public function syncStatus($survey)
    {
        if (!$survey) {
            throw new Exception('Survey không hợp lệ.', 400);
        }

        try {
            $oldStatus = $survey->status;
            $computed = $this->getComputedStatus($survey);
            $now = Carbon::now();
            $needsSave = false;

            // === TỰ ĐỘNG KÍCH HOẠT + CÓ time_limit + CÓ start_at → GHI ĐÈ end_at = start_at + time_limit ===
            if ($computed === 'active' && $oldStatus !== 'active' && $survey->time_limit && $survey->time_limit > 0) {
                try {
                    $startAt = $survey->start_at ? Carbon::parse($survey->start_at)->setTimezone($now->timezone) : null;
                    
                    // Chỉ tính end_at nếu có start_at: end_at = start_at + time_limit
                    if ($startAt) {
                        $newEndAt = $startAt->copy()->addMinutes($survey->time_limit);
                        
                        if (!$survey->end_at || !$survey->end_at->eq($newEndAt)) {
                            $survey->end_at = $newEndAt;
                            $needsSave = true;
                            Log::info("Survey {$survey->id}: AUTO SET end_at = start_at + time_limit", [
                                'start_at' => $startAt->format('Y-m-d H:i:s'),
                                'time_limit' => $survey->time_limit,
                                'end_at' => $newEndAt->format('Y-m-d H:i:s'),
                            ]);
                        }
                    }
                } catch (\Exception $e) {
                    Log::error("Survey {$survey->id}: Lỗi parse date trong syncStatus", [
                        'error' => $e->getMessage(),
                        'start_at' => $survey->start_at,
                        'trace' => $e->getTraceAsString()
                    ]);
                    // Tiếp tục xử lý status sync dù có lỗi parse date
                }
                // Nếu không có start_at → không set end_at, dùng end_at ban đầu (nếu có)
            }

            // === CẬP NHẬT STATUS ===
            if ($survey->status !== $computed) {
                Log::info("Survey {$survey->id}: STATUS SYNC", [
                    'from' => $oldStatus,
                    'to' => $computed,
                ]);
                $survey->status = $computed;
                $needsSave = true;
            }

            if ($needsSave) {
                if (!$survey->save()) {
                    Log::error("Survey {$survey->id}: Không thể lưu trạng thái", [
                        'computed_status' => $computed,
                        'old_status' => $oldStatus
                    ]);
                    throw new Exception('Không thể lưu trạng thái khảo sát.', 500);
                }
            }

            $freshSurvey = $survey->fresh();
            if (!$freshSurvey) {
                Log::warning("Survey {$survey->id}: Không thể tải lại sau khi sync", [
                    'computed_status' => $computed
                ]);
                // Trả về survey hiện tại nếu không load được fresh
                return $survey;
            }

            return $freshSurvey;

        } catch (Exception $e) {
            // Nếu đã có code và message rõ ràng, throw lại
            if ($e->getCode() >= 400 && $e->getCode() < 600) {
                throw $e;
            }
            
            Log::error("Survey {$survey->id}: Lỗi không xác định trong syncStatus", [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            throw new Exception('Không thể đồng bộ trạng thái: ' . $e->getMessage(), 500);
        }
    }
}