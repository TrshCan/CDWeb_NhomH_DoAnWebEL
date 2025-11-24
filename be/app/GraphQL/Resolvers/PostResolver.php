<?php

namespace App\GraphQL\Resolvers;

use App\Services\PostService;
use App\Services\LikeService;
use App\Services\PermissionService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class PostResolver
{
    protected $service;
    protected $likeService;
    protected $permissionService;

    public function __construct(PostService $service, LikeService $likeService, PermissionService $permissionService)
    {
        $this->service = $service;
        $this->likeService = $likeService;
        $this->permissionService = $permissionService;
    }

    public function all()
    {
        return $this->service->all();
    }

    public function find($root, array $args)
    {
        return $this->service->find($args['id']);
    }

    public function byUser($root, array $args)
    {
        return $this->service->byUser($args['user_id']);
    }

    public function byType($root, array $args)
    {
        return $this->service->byType($args['type']);
    }


    public function byGroup($root, array $args)
    {
        return $this->service->byGroup($args['group_id']);
    }

    public function repliesByUser($root, array $args)
    {
        return $this->service->repliesByUser($args['user_id']);
    }

    public function likedPostsByUser($root, array $args)
    {
        return $this->service->likedPostsByUser($args['user_id']);
    }

    public function create($root, array $args)
    {
        Log::debug('PostResolver create input:', ['input' => $args['input']]);

        // Kiểm tra permission
        $user = Auth::user();
        if (!$user) {
            throw ValidationException::withMessages([
                'permission' => 'Bạn chưa đăng nhập',
            ]);
        }

        // Nếu có parent_id thì là comment, cần permission 'comment_post'
        // Nếu không có parent_id thì là post mới, cần permission 'create_post'
        $permissionName = !empty($args['input']['parent_id']) ? 'comment_post' : 'create_post';

        if (!$this->permissionService->hasPermission($user, $permissionName)) {
            throw ValidationException::withMessages([
                'permission' => "Bạn không có quyền sử dụng chức năng này.",
            ]);
        }

        // Filter out null files from media array and ensure they are UploadedFile instances
        $media = $args['media'] ?? [];
        $media = array_filter($media, function ($file) {
            return $file !== null
                && $file !== false
                && $file instanceof \Illuminate\Http\UploadedFile;
        });
        $media = array_values($media); // Re-index array

        Log::debug('PostResolver create media count:', ['count' => count($media)]);

        try {
            return $this->service->create($args['input'], $media);
        } catch (\Exception $e) {
            Log::error('PostResolver create error:', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            throw $e;
        }
    }

    public function update($root, array $args)
    {
        return $this->service->update($args['input']);
    }

    public function delete($root, array $args)
    {
        // Kiểm tra permission
        $user = Auth::user();
        if (!$user) {
            throw ValidationException::withMessages([
                'permission' => 'Bạn chưa đăng nhập',
            ]);
        }

        if (!$this->permissionService->hasPermission($user, 'delete_post')) {
            throw ValidationException::withMessages([
                'permission' => 'Bạn không có quyền sử dụng chức năng này.',
            ]);
        }

        return $this->service->delete($args['id']);
    }

    public function toggleLike($root, array $args)
    {
        // Kiểm tra permission
        $user = Auth::user();
        if (!$user) {
            throw ValidationException::withMessages([
                'permission' => 'Bạn chưa đăng nhập',
            ]);
        }

        if (!$this->permissionService->hasPermission($user, 'like_post')) {
            throw ValidationException::withMessages([
                'permission' => 'Bạn không có quyền sử dụng chức năng này.',
            ]);
        }

        return $this->likeService->toggle($args['post_id'], $args['user_id']);
    }

    public function postsOfFollowing($_, array $args)
    {
        $ids = $args['followingIds'] ?? [];

        // Resolver is the *control* layer – just forward to service
        return $this->service->getPostsOfFollowing($ids);
    }
}
