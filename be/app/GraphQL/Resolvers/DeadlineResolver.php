<?php

namespace App\GraphQL\Resolvers;

use App\Services\DeadlineService;
use App\Services\PermissionService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

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

            return $this->deadlineService->createDeadline($args['input']);
        } catch (ValidationException $e) {
            // Re-throw validation exceptions as-is
            throw $e;
        } catch (\Exception $e) {
            throw new \Exception($e->getMessage());
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
            return $this->deadlineService->updateDeadline($id, $args['input']);
        } catch (ValidationException $e) {
            // Re-throw validation exceptions as-is
            throw $e;
        } catch (\Exception $e) {
            throw new \Exception($e->getMessage());
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
            throw new \Exception($e->getMessage());
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
            throw new \Exception($e->getMessage());
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
        $id = is_numeric($args['id']) ? (int)$args['id'] : $args['id'];
        return $this->deadlineService->getDeadlineById($id);
    }
}