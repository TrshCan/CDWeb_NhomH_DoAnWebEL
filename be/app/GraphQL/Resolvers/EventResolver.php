<?php

namespace App\GraphQL\Resolvers;

use App\Services\EventService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class EventResolver
{
    protected EventService $eventService;

    public function __construct(EventService $eventService)
    {
        $this->eventService = $eventService;
    }

    public function createEvent($_, array $args)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                throw ValidationException::withMessages([
                    'auth' => 'Bạn chưa đăng nhập.'
                ]);
            }
            
            // Kiểm tra quyền admin
            if (!$user->isAdmin()) {
                throw ValidationException::withMessages([
                    'permission' => 'Bạn không có quyền tạo sự kiện.'
                ]);
            }
            
            return $this->eventService->createEvent($args['input'], $user);
        } catch (ValidationException $e) {
            // Re-throw validation exceptions as-is
            throw $e;
        } catch (\Exception $e) {
            Log::error('EventResolver createEvent error:', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            throw new \Exception($e->getMessage());
        }
    }

    public function updateEvent($_, array $args)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                throw ValidationException::withMessages([
                    'auth' => 'Bạn chưa đăng nhập.'
                ]);
            }
            
            // Get updated_at from input if provided (for optimistic locking)
            $updatedAt = $args['input']['updated_at'] ?? null;
            unset($args['input']['updated_at']); // Remove from input data
            
            return $this->eventService->updateEvent($args['id'], $args['input'], $user, $updatedAt);
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Exception $e) {
            Log::error('EventResolver updateEvent error:', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            throw new \Exception($e->getMessage());
        }
    }

    public function deleteEvent($_, array $args)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                throw ValidationException::withMessages([
                    'auth' => 'Bạn chưa đăng nhập.'
                ]);
            }
            
            // Kiểm tra quyền admin
            if (!$user->isAdmin()) {
                throw ValidationException::withMessages([
                    'permission' => 'Bạn không có quyền xóa sự kiện.'
                ]);
            }
            
            return $this->eventService->deleteEvent($args['id']);
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Exception $e) {
            // Đảm bảo message được truyền đúng
            $message = $e->getMessage();
            if (empty($message)) {
                $message = 'Không thể xóa sự kiện. Vui lòng thử lại sau.';
            }
            Log::error('EventResolver deleteEvent error:', [
                'message' => $message,
                'trace' => $e->getTraceAsString(),
            ]);
            throw new \Exception($message);
        }
    }

    public function restoreEvent($_, array $args)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                throw ValidationException::withMessages([
                    'auth' => 'Bạn chưa đăng nhập.'
                ]);
            }
            
            // Kiểm tra quyền admin
            if (!$user->isAdmin()) {
                throw ValidationException::withMessages([
                    'permission' => 'Bạn không có quyền khôi phục sự kiện.'
                ]);
            }
            
            return $this->eventService->restoreEvent($args['id']);
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Exception $e) {
            Log::error('EventResolver restoreEvent error:', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            throw new \Exception($e->getMessage());
        }
    }

    public function getPaginatedEvents($_, array $args)
    {
        try {
            $perPage = $args['perPage'] ?? 5;
            $page = $args['page'] ?? 1;
            $includeDeleted = $args['includeDeleted'] ?? false;
            return $this->eventService->getPaginatedEvents($perPage, $page, $includeDeleted);
        } catch (\Exception $e) {
            Log::error('EventResolver getPaginatedEvents error:', [
                'message' => $e->getMessage(),
            ]);
            throw new \Exception($e->getMessage());
        }
    }

    public function searchEvents($_, array $args)
    {
        try {
            $filters = $args['filter'] ?? [];
            $perPage = $args['perPage'] ?? 5;
            $page = $args['page'] ?? 1;
            return $this->eventService->searchEvents($filters, $perPage, $page);
        } catch (\Exception $e) {
            Log::error('EventResolver searchEvents error:', [
                'message' => $e->getMessage(),
            ]);
            throw new \Exception($e->getMessage());
        }
    }

    public function getEventById($_, array $args)
    {
        try {
            return $this->eventService->getEventById($args['id']);
        } catch (\Exception $e) {
            Log::error('EventResolver getEventById error:', [
                'id' => $args['id'] ?? null,
                'message' => $e->getMessage(),
            ]);
            throw new \Exception($e->getMessage());
        }
    }

    public function all($_, array $args)
    {
        return $this->eventService->getAllEvents();
    }

    public function find($_, array $args)
    {
        return $this->eventService->getEventById($args['id']);
    }

    public function byUser($_, array $args)
    {
        try {
            return $this->eventService->getEventsByUser($args['user_id']);
        } catch (\Exception $e) {
            Log::error('EventResolver byUser error:', [
                'user_id' => $args['user_id'] ?? null,
                'message' => $e->getMessage(),
            ]);
            throw new \Exception($e->getMessage());
        }
    }

    public function today($_, array $args)
    {
        return $this->eventService->today();
    }

    /**
     * Resolver cho field user trong Event type
     * Map từ relationship createdBy
     */
    public function user($event)
    {
        return $event->createdBy;
    }
    
}