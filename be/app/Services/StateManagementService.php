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

                // === 1. KÍCH HOẠT + CÓ time_limit → GHI ĐÈ end_at = THỜI GIAN HIỆN TẠI + time_limit ===
                if ($newStatus === 'active' && $survey->time_limit && $survey->time_limit > 0) {
                    try {
                        // Tính end_at từ thời gian kích hoạt hiện tại + time_limit
                        $calculatedEndAt = $now->copy()->addMinutes($survey->time_limit);
                        
                        // Luôn cập nhật end_at khi kích hoạt với time_limit
                        $survey->end_at = $calculatedEndAt;
                        Log::info("Survey {$survey->id}: SET end_at = ACTIVATION_TIME + time_limit", [
                            'activation_time' => $now->format('Y-m-d H:i:s'),
                            'time_limit' => $survey->time_limit,
                            'calculated_end_at' => $calculatedEndAt->format('Y-m-d H:i:s'),
                        ]);
                        
                        if (!$survey->save()) {
                            throw new Exception('Không thể cập nhật thời gian kết thúc.', 500);
                        }
                        $survey = $survey->fresh();
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

                // === 2.1. KIỂM TRA NẾU SAU SYNC ĐÃ LÀ CLOSED (QUÁ THỜI GIAN) ===
                // Nếu sau khi sync, status đã là 'closed' (do quá thời gian), 
                // thì không cho phép chuyển sang trạng thái khác (trừ khi đang cố đóng)
                if ($survey->status === 'closed' && $newStatus !== 'closed') {
                    throw ValidationException::withMessages([
                        'status' => 'Khảo sát đã quá thời gian và đã được tự động đóng. Không thể thay đổi trạng thái.'
                    ]);
                }

                // === 3. KIỂM TRA TRẠNG THÁI TRÙNG ===
                if ($survey->status === $newStatus) {
                    if ($originalStatus !== $survey->status) {
                        $message = match ($newStatus) {
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
            'paused'  => $this->fromPaused($newStatus, $now, $endAt, $survey),
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

        // Cho phép đóng sớm trong mọi trường hợp - người dùng có quyền đóng khảo sát bất cứ lúc nào
        // Không cần kiểm tra thời gian kết thúc khi đóng thủ công
        if ($newStatus === 'closed') {
            Log::info("Survey {$survey->id}: Manual close requested", [
                'current_status' => $survey->status,
                'end_at' => $endAt?->format('Y-m-d H:i:s'),
                'now' => $now->format('Y-m-d H:i:s'),
            ]);
        }
    }

    private function fromPaused($newStatus, $now, $endAt, $survey)
    {
        if (!in_array($newStatus, ['active', 'closed'])) {
            throw ValidationException::withMessages(['status' => 'Chỉ có thể chuyển sang "Tiếp tục" hoặc "Đóng".']);
        }

        // Cho phép đóng sớm trong mọi trường hợp - người dùng có quyền đóng khảo sát bất cứ lúc nào
        // Không cần kiểm tra thời gian kết thúc khi đóng thủ công
        if ($newStatus === 'closed') {
            Log::info("Survey {$survey->id}: Manual close from paused requested", [
                'current_status' => $survey->status,
                'end_at' => $endAt?->format('Y-m-d H:i:s'),
                'now' => $now->format('Y-m-d H:i:s'),
            ]);
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

        // === KIỂM TRA end_at ĐỂ TỰ ĐỘNG ĐÓNG ===
        // Bất kể có time_limit hay không, nếu có end_at và đã quá thời gian → đóng
        try {
            if ($endAt && $now->gt($endAt) && in_array($survey->status, ['active', 'paused'])) {
                $logData = [
                    'end_at' => $endAt->format('Y-m-d H:i:s'),
                    'now' => $now->format('Y-m-d H:i:s'),
                ];
                
                if ($survey->time_limit && $survey->time_limit > 0) {
                    $logData['time_limit'] = $survey->time_limit;
                    Log::info("Survey {$survey->id}: AUTO-CLOSE by time_limit (activation_time + time_limit)", $logData);
                } else {
                    Log::info("Survey {$survey->id}: AUTO-CLOSE by manual end_at", $logData);
                }
                
                return 'closed';
            }
        } catch (\Exception $e) {
            Log::warning("Survey {$survey->id}: Lỗi so sánh end_at", [
                'error' => $e->getMessage(),
                'end_at' => $endAt?->format('Y-m-d H:i:s')
            ]);
        }

        // === 3. TRẠNG THÁI CỐ ĐỊNH ===
        if ($survey->status === 'closed') return 'closed';
        if ($survey->status === 'paused') return 'paused';
        if ($survey->status === 'active') return 'active';
        if ($survey->status === 'pending') return 'pending';

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

            // === KHÔNG CẦN XỬ LÝ time_limit TRONG syncStatus ===
            // end_at đã được set khi kích hoạt, syncStatus chỉ cần kiểm tra trạng thái
            // Không cần tính toán lại end_at trong syncStatus

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