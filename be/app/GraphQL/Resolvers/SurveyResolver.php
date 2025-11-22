<?php

namespace App\GraphQL\Resolvers;

use App\Services\SurveyService;

class SurveyResolver
{
    protected SurveyService $service;
use App\Models\Survey;
use Nuwave\Lighthouse\Support\Contracts\GraphQLContext;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class SurveyResolver
{
    protected $service;

    public function __construct(SurveyService $service)
    {
        $this->service = $service;
    }

    /**
     * @param  mixed  $_
     * @param  array<string, mixed>  $args
     */
    public function surveysMade($_, array $args)
    {
        // Verify authentication
        $token = request()->bearerToken();
        if (!$token) {
            throw new \Exception('Authentication required');
        }

        $user = \App\Models\User::where('remember_token', $token)->first();
        if (!$user) {
            throw new \Exception('Invalid or expired token');
        }

        $createdBy = (int) ($args['createdBy'] ?? 0);
        if ($createdBy <= 0) {
            return [];
        }

        // Verify the user is requesting their own surveys
        if ($user->id !== $createdBy) {
            throw new \Exception('Unauthorized: You can only view your own surveys');
        }

        return $this->service->listByCreatorWithStatus($createdBy);
    }

    /**
     * @param  mixed  $_
     * @param  array<string, mixed>  $args
     */
    public function surveyRawData($_, array $args)
    {
        // Verify authentication
        $token = request()->bearerToken();
        if (!$token) {
            throw new \Exception('Authentication required');
        }

        $user = \App\Models\User::where('remember_token', $token)->first();
        if (!$user) {
            throw new \Exception('Invalid or expired token');
        }

        $surveyId = (int) ($args['surveyId'] ?? 0);
        if ($surveyId <= 0) {
            return [
                'title' => 'Khảo sát',
                'responses' => [],
            ];
        }

        // Verify the user owns this survey
        $survey = \App\Models\Survey::find($surveyId);
        if (!$survey || $survey->created_by !== $user->id) {
            throw new \Exception('Unauthorized: You can only view data for your own surveys');
        }

        return $this->service->getRawData($surveyId);
    }

    /**
     * @param  null  $_
     * @param  array<string, mixed>  $args
     */
    public function surveyOverview($_, array $args)
    {
        // Verify authentication
        $token = request()->bearerToken();
        if (!$token) {
            throw new \Exception('Authentication required');
        }

        $user = \App\Models\User::where('remember_token', $token)->first();
        if (!$user) {
            throw new \Exception('Invalid or expired token');
        }

        $surveyId = (int) ($args['surveyId'] ?? 0);
        if ($surveyId <= 0) {
            return [
                'title' => 'Khảo sát',
                'totalResponses' => 0,
                'questions' => [],
            ];
        }

        // Verify the user owns this survey
        $survey = \App\Models\Survey::find($surveyId);
        if (!$survey || $survey->created_by !== $user->id) {
            throw new \Exception('Unauthorized: You can only view overview for your own surveys');
        }

        return $this->service->getSurveyOverview($surveyId);
    }

    /**
     * @param  mixed  $_
     * @param  array<string, mixed>  $args
     */
    public function surveyResponseDetail($_, array $args)
    {
        // Verify authentication
        $token = request()->bearerToken();
        if (!$token) {
            throw new \Exception('Authentication required');
        }

        $user = \App\Models\User::where('remember_token', $token)->first();
        if (!$user) {
            throw new \Exception('Invalid or expired token');
        }

        $surveyId = (int) ($args['surveyId'] ?? 0);
        $responseId = (string) ($args['responseId'] ?? '');

        if ($surveyId <= 0 || $responseId === '') {
            return null;
        }

        // Verify the user owns this survey
        $survey = \App\Models\Survey::find($surveyId);
        if (!$survey || $survey->created_by !== $user->id) {
            throw new \Exception('Unauthorized: You can only view responses for your own surveys');
        }

        return $this->service->getResponseDetail($surveyId, $responseId);
    }

    public function surveysCompleted($_, array $args)
    {
        // Verify authentication
        $token = request()->bearerToken();
        if (!$token) {
            throw new \Exception('Authentication required');
        }

        $user = \App\Models\User::where('remember_token', $token)->first();
        if (!$user) {
            throw new \Exception('Invalid or expired token');
        }

        $userId = (int) ($args['userId'] ?? 0);
        if ($userId <= 0) return [];

        // Verify the user is requesting their own completed surveys
        if ($user->id !== $userId) {
            throw new \Exception('Unauthorized: You can only view your own completed surveys');
        }

        return $this->service->listCompletedByUser($userId);
    }
}


    public function list($_, array $args)
    {
        $perPage = $args['per_page'] ?? 100;
        $filterInput = $args['filter'] ?? [];
        
        // Xây dựng filters array
        $filters = [];
        if (!empty($filterInput['categories_id'])) {
            $filters['categories_id'] = $filterInput['categories_id'];
        }
        if (!empty($filterInput['type'])) {
            $filters['type'] = $filterInput['type'];
        }
        if (!empty($filterInput['status'])) {
            $filters['status'] = $filterInput['status'];
        }
        if (!empty($filterInput['keyword'])) {
            $filters['keyword'] = $filterInput['keyword'];
        }
        if (!empty($filterInput['created_by'])) {
            $filters['created_by'] = (int) $filterInput['created_by'];
        }
        if (!empty($filterInput['creator_name'])) {
            $filters['creator_name'] = $filterInput['creator_name'];
        }
        
        $paginator = $this->service->getAllSurveys($perPage, $filters);
        return $paginator->items(); // Trả về mảng Survey[]
    }

    public function updateSurvey($root, array $args)
    {
        try {
            // Kiểm tra quyền: chỉ admin và lecturer mới có thể sửa survey
            $user = Auth::user();
            if (!$user) {
                throw ValidationException::withMessages([
                    'permission' => 'Bạn chưa đăng nhập. Vui lòng đăng nhập để sử dụng chức năng này.',
                ]);
            }

            if (!$user->isAdmin() && !$user->isLecturer()) {
                throw ValidationException::withMessages([
                    'permission' => 'Bạn không có quyền sửa khảo sát. Chỉ admin và giáo viên mới có quyền này.',
                ]);
            }

            $id = $args['id'];
            $input = $args['input'];

            // Gọi service để xử lý cập nhật
            $updatedSurvey = $this->service->updateSurvey($id, $input);

            return $updatedSurvey;
        } catch (ValidationException $e) {
            // Re-throw validation exceptions as-is để Lighthouse xử lý đúng
            throw $e;
        } catch (\Exception $e) {
            throw new \GraphQL\Error\Error(
                $e->getMessage(),
                null,
                null,
                [],
                null,
                $e,
                ['category' => $e->getCode() === 404 ? 'NOT_FOUND' : 'INTERNAL_SERVER_ERROR']
            );
        }
    }



    public function createSurvey($root, array $args, GraphQLContext $context): Survey
    {
        try {
            // Kiểm tra quyền: chỉ admin và lecturer mới có thể tạo survey
            $user = Auth::user();
            if (!$user) {
                throw ValidationException::withMessages([
                    'permission' => 'Bạn chưa đăng nhập. Vui lòng đăng nhập để sử dụng chức năng này.',
                ]);
            }

            if (!$user->isAdmin() && !$user->isLecturer()) {
                throw ValidationException::withMessages([
                    'permission' => 'Bạn không có quyền tạo khảo sát. Chỉ admin và giáo viên mới có quyền này.',
                ]);
            }

            $data = [
                'title' => $args['input']['title'],
                'description' => $args['input']['description'] ?? null,
                'categories_id' => $args['input']['categories_id'],
                'type' => $args['input']['type'] ?? null,
                'start_at' => $args['input']['start_at'] ?? null,
                'end_at' => $args['input']['end_at'] ?? null,
                'time_limit' => $args['input']['time_limit'] ?? null,
                'points' => $args['input']['points'] ?? null,
                'object' => $args['input']['object'] ?? null,
                'created_by' => $args['input']['created_by'],
                'status' => $args['input']['status'] ?? 'pending', // ✅ default là pending
            ];


            return $this->service->createSurvey($data);
        } catch (ValidationException $e) {
            // Re-throw validation exceptions as-is để Lighthouse xử lý đúng
            throw $e;
        } catch (\Exception $e) {
            throw new \GraphQL\Error\Error(
                $e->getMessage(),
                null,
                null,
                [],
                null,
                $e,
                ['category' => $e->getCode() === 404 ? 'NOT_FOUND' : 'INTERNAL_SERVER_ERROR']
            );
        }
    }
    public function deleteSurvey($_, array $args)
    {
        try {
            // Kiểm tra quyền: chỉ admin và lecturer mới có thể xóa survey
            $user = Auth::user();
            if (!$user) {
                throw ValidationException::withMessages([
                    'permission' => 'Bạn chưa đăng nhập. Vui lòng đăng nhập để sử dụng chức năng này.',
                ]);
            }

            if (!$user->isAdmin() && !$user->isLecturer()) {
                throw ValidationException::withMessages([
                    'permission' => 'Bạn không có quyền xóa khảo sát. Chỉ admin và giáo viên mới có quyền này.',
                ]);
            }

            $result = $this->service->deleteSurvey($args['id']);
            return $result;
        } catch (\Illuminate\Validation\ValidationException $e) {
            throw new \Nuwave\Lighthouse\Exceptions\ValidationException(
                'Validation failed.',
                $e->validator
            );
        } catch (\Exception $e) {
            $code = (int) $e->getCode();
            $message = $e->getMessage() ?: 'Không thể xóa khảo sát.';
            
            // Log lỗi để debug
            \Log::error('GraphQL deleteSurvey error', [
                'id' => $args['id'] ?? null,
                'message' => $message,
                'code' => $code,
                'exception' => get_class($e),
                'trace' => $e->getTraceAsString()
            ]);
            
            // Tránh đẩy lỗi 500 chung chung ra FE
            $category = 'BAD_REQUEST';
            if ($code === 404) {
                $category = 'NOT_FOUND';
            } elseif ($code === 403) {
                $category = 'FORBIDDEN';
            } elseif ($code === 422) {
                $category = 'VALIDATION_FAILED';
            } elseif ($code >= 500) {
                $category = 'INTERNAL_SERVER_ERROR';
            }
            
            throw new \GraphQL\Error\Error(
                $message,
                null,
                null,
                [],
                null,
                $e,
                ['category' => $category]
            );
        }
    }
    /**
     * 🔍 Xem chi tiết khảo sát theo ID
     */
    public function getSurveyById($root, array $args)
    {
        try {
            $id = $args['id'];
            return $this->service->getSurveyById($id);
        } catch (\Exception $e) {
            throw new \GraphQL\Error\Error(
                $e->getMessage(),
                null,
                null,
                [],
                null,
                $e,
                ['category' => $e->getCode() === 404 ? 'NOT_FOUND' : 'INTERNAL_SERVER_ERROR']
            );
        }
    }

    /**
     * Field resolver để resolve creator_name
     * Tự động load từ relationship nếu chưa có
     */
    public function resolveCreatorName($root)
    {
        // Nếu đã có creator_name từ join query
        if (isset($root->creator_name)) {
            return $root->creator_name;
        }

        // Load từ relationship nếu chưa được load
        if (!$root->relationLoaded('creator')) {
            $root->load('creator');
        }

        return $root->creator?->name;
    }
