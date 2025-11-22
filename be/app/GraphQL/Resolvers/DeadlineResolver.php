<?php

namespace App\GraphQL\Resolvers;

use App\Services\DeadlineService;
use App\Services\PermissionService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use GraphQL\Error\Error;

class DeadlineResolver
{
    protected DeadlineService $deadlineService;
    protected PermissionService $permissionService;

    public function __construct(DeadlineService $deadlineService, PermissionService $permissionService)
    {
        $this->deadlineService = $deadlineService;
        $this->permissionService = $permissionService;
    }

    public function createDeadline($_, array $args)
    {
        try {
            // Kiểm tra quyền admin
            $user = Auth::user();
            if (!$this->permissionService->checkAdminPermission($user)) {
                throw ValidationException::withMessages([
                    'permission' => 'Bạn không có quyền thêm deadline. Chỉ admin mới có quyền này.',
                ]);
            }

            $userId = Auth::id();
            return $this->deadlineService->createDeadline($args['input'], $userId);
        } catch (ValidationException $e) {
            // Re-throw validation exceptions as-is
            throw $e;
        } catch (\Exception $e) {
            // Đảm bảo message được truyền đúng
            $message = $e->getMessage();
            if (empty($message)) {
                $message = 'Không thể tạo deadline. Vui lòng thử lại sau.';
            }
            Log::error('DeadlineResolver createDeadline error:', [
                'message' => $message,
                'userId' => $user->id ?? null,
                'input' => $args['input'] ?? null,
            ]);
            // Sử dụng GraphQL Error để đảm bảo message được truyền đúng
            throw new Error($message);
        }
    }

    public function updateDeadline($_, array $args)
    {
        try {
            // Kiểm tra quyền admin
            $user = Auth::user();
            if (!$this->permissionService->checkAdminPermission($user)) {
                throw ValidationException::withMessages([
                    'permission' => 'Bạn không có quyền sửa deadline. Chỉ admin mới có quyền này.',
                ]);
            }

            $id = is_numeric($args['id']) ? (int)$args['id'] : $args['id'];
            
            // Get updated_at from input if provided (for optimistic locking)
            $updatedAt = $args['input']['updated_at'] ?? null;
            unset($args['input']['updated_at']); // Remove from input data
            
            return $this->deadlineService->updateDeadline($id, $args['input'], $updatedAt);
        } catch (ValidationException $e) {
            // Re-throw validation exceptions as-is
            throw $e;
        } catch (\Exception $e) {
            // Đảm bảo message được truyền đúng
            $message = $e->getMessage();
            if (empty($message)) {
                $message = 'Không thể cập nhật deadline. Vui lòng thử lại sau.';
            }
            Log::error('DeadlineResolver updateDeadline error:', [
                'message' => $message,
                'id' => $id ?? null,
                'userId' => $user->id ?? null,
            ]);
            // Sử dụng GraphQL Error để đảm bảo message được truyền đúng
            throw new Error($message);
        }
    }

    public function deleteDeadline($_, array $args)
    {
        try {
            // Kiểm tra quyền admin
            $user = Auth::user();
            if (!$this->permissionService->checkAdminPermission($user)) {
                throw ValidationException::withMessages([
                    'permission' => 'Bạn không có quyền xóa deadline. Chỉ admin mới có quyền này.',
                ]);
            }

            $id = is_numeric($args['id']) ? (int)$args['id'] : $args['id'];
            return $this->deadlineService->deleteDeadline($id);
        } catch (ValidationException $e) {
            // Re-throw validation exceptions as-is
            throw $e;
        } catch (\Exception $e) {
            // Đảm bảo message được truyền đúng
            $message = $e->getMessage();
            if (empty($message)) {
                $message = 'Không thể xóa deadline. Vui lòng thử lại sau.';
            }
            Log::error('DeadlineResolver deleteDeadline error:', [
                'message' => $message,
                'id' => $id ?? null,
                'userId' => $user->id ?? null,
                'trace' => $e->getTraceAsString(),
            ]);
            // Sử dụng GraphQL Error để đảm bảo message được truyền đúng
            throw new Error($message);
        }
    }

    public function restoreDeadline($_, array $args)
    {
        try {
            // Kiểm tra quyền admin
            $user = Auth::user();
            if (!$this->permissionService->checkAdminPermission($user)) {
                throw ValidationException::withMessages([
                    'permission' => 'Bạn không có quyền khôi phục deadline. Chỉ admin mới có quyền này.',
                ]);
            }

            $id = is_numeric($args['id']) ? (int)$args['id'] : $args['id'];
            return $this->deadlineService->restoreDeadline($id);
        } catch (ValidationException $e) {
            // Re-throw validation exceptions as-is
            throw $e;
        } catch (\Exception $e) {
            // Đảm bảo message được truyền đúng
            $message = $e->getMessage();
            if (empty($message)) {
                $message = 'Không thể khôi phục deadline. Vui lòng thử lại sau.';
            }
            Log::error('DeadlineResolver restoreDeadline error:', [
                'message' => $message,
                'id' => $id ?? null,
                'userId' => $user->id ?? null,
            ]);
            // Sử dụng GraphQL Error để đảm bảo message được truyền đúng
            throw new Error($message);
        }
    }

    public function getPaginatedDeadlines($_, array $args)
    {
        $perPage = $args['perPage'] ?? 3;
        $page = $args['page'] ?? 1;
        $includeDeleted = $args['includeDeleted'] ?? false;
        return $this->deadlineService->getPaginatedDeadlines($perPage, $page, $includeDeleted);
    }

    public function searchDeadlines($_, array $args)
    {
        $filters = $args['filter'] ?? [];
        $perPage = $args['perPage'] ?? 5;
        $page = $args['page'] ?? 1;
        return $this->deadlineService->searchDeadlines($filters, $perPage, $page);
    }

    public function getDeadlineById($_, array $args)
    {
        try {
            $id = $args['id'] ?? null;
            return $this->deadlineService->getDeadlineById($id);
        } catch (\Exception $e) {
            throw new \Exception($e->getMessage());
        }
    }

    public function upcoming($_, array $args)
    {
        return $this->deadlineService->upcoming();
    }

    /**
     * Resolver cho field user trong Deadline type
     * Map từ relationship creator
     */
    public function user($deadline)
    {
        return $deadline->creator;
    }
}