<?php

namespace App\GraphQL\Resolvers;

use App\Services\StateManagementService;
use Illuminate\Validation\ValidationException;
use Exception;
use Illuminate\Support\Facades\Log;

class StateManagementResolver
{
    protected $service;

    public function __construct(StateManagementService $service)
    {
        $this->service = $service;
    }

    public function changeSurveyStatus($_, array $args)
    {
        try {
            $user = auth()->user();
            if (!$user) {
                throw new Exception('Bạn chưa đăng nhập.', 401);
            }
            
            // Kiểm tra quyền: Admin hoặc chủ sở hữu khảo sát
            $survey = \App\Models\Survey::findOrFail($args['id']);
            if ($user->role !== 'admin' && $survey->created_by !== $user->id) {
                throw new Exception('Bạn không có quyền thay đổi trạng thái khảo sát này.', 403);
            }
            
            return $this->service->changeStatus($args['id'], $args['status']);
        } catch (ValidationException $e) {
            $msg = collect($e->errors())->flatten()->first() ?? 'Dữ liệu không hợp lệ.';
            return ['survey' => null, 'message' => $msg];
        } catch (Exception $e) {
            Log::error('Change survey status error', [
                'survey_id' => $args['id'] ?? null,
                'error' => $e->getMessage()
            ]);
            
            if ($e->getCode() === 401 || $e->getCode() === 403) {
                return ['survey' => null, 'message' => $e->getMessage()];
            }
            
            return ['survey' => null, 'message' => 'Hệ thống lỗi, vui lòng thử lại.'];
        }
    }

    public function toggleReviewPermission($_, array $args)
    {
        try {
            $user = auth()->user();
            if (!$user) {
                throw new Exception('Bạn chưa đăng nhập.', 401);
            }
            
            // Kiểm tra quyền: Admin hoặc chủ sở hữu khảo sát
            $survey = \App\Models\Survey::findOrFail($args['id']);
            if ($user->role !== 'admin' && $survey->created_by !== $user->id) {
                throw new Exception('Bạn không có quyền thay đổi quyền xem lại của khảo sát này.', 403);
            }
            
            return $this->service->toggleReviewPermission($args['id'], $args['allowReview']);
        } catch (ValidationException $e) {
            $msg = collect($e->errors())->flatten()->first() ?? 'Không thể cập nhật.';
            return ['survey' => null, 'message' => $msg];
        } catch (Exception $e) {
            Log::error('Toggle review permission failed', ['error' => $e->getMessage()]);
            
            if ($e->getCode() === 401 || $e->getCode() === 403) {
                return ['survey' => null, 'message' => $e->getMessage()];
            }
            
            return ['survey' => null, 'message' => 'Cập nhật thất bại.'];
        }
    }

    /**
     * Lấy danh sách surveys và tự động sync status
     * User (không phải admin) chỉ thấy khảo sát của mình, Admin thấy tất cả
     */
    public function listSurveys($_, array $args)
    {
        try {
            $user = auth()->user();
            
            if (!$user) {
                throw new Exception('Bạn chưa đăng nhập.', 401);
            }

            $query = \App\Models\Survey::whereNull('deleted_at');
            
            // Nếu không phải admin, chỉ lấy khảo sát của mình
            if ($user->role !== 'admin') {
                $query->where('created_by', $user->id);
            }
            // Admin thấy tất cả (không filter)
            
            $surveys = $query->orderByDesc('created_at')->get();

            foreach ($surveys as $survey) {
                app(StateManagementService::class)->syncStatus($survey);
            }

            return \App\Models\Survey::whereNull('deleted_at')
                ->when($user->role !== 'admin', function ($q) use ($user) {
                    return $q->where('created_by', $user->id);
                })
                ->orderByDesc('created_at')
                ->get();
        } catch (Exception $e) {
            Log::error('List surveys failed', ['error' => $e->getMessage()]);
            
            if ($e->getCode() === 401) {
                throw $e;
            }
            
            return [];
        }
    }
}