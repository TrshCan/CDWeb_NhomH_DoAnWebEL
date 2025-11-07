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
            return $this->service->changeStatus($args['id'], $args['status']);
        } catch (ValidationException $e) {
            $msg = collect($e->errors())->flatten()->first() ?? 'Dữ liệu không hợp lệ.';
            return ['survey' => null, 'message' => $msg];
        } catch (Exception $e) {
            Log::error('Change survey status error', [
                'survey_id' => $args['id'] ?? null,
                'error' => $e->getMessage()
            ]);
            return ['survey' => null, 'message' => 'Hệ thống lỗi, vui lòng thử lại.'];
        }
    }

    public function toggleReviewPermission($_, array $args)
    {
        try {
            return $this->service->toggleReviewPermission($args['id'], $args['allowReview']);
        } catch (ValidationException $e) {
            $msg = collect($e->errors())->flatten()->first() ?? 'Không thể cập nhật.';
            return ['survey' => null, 'message' => $msg];
        } catch (Exception $e) {
            Log::error('Toggle review permission failed', ['error' => $e->getMessage()]);
            return ['survey' => null, 'message' => 'Cập nhật thất bại.'];
        }
    }
}