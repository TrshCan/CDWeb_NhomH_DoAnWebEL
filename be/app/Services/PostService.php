<?php

namespace App\Services;

use App\Repositories\PostRepository;
use App\Models\Group;
use App\Models\Post;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Storage;

class PostService
{
    protected $repository;

    public function __construct(PostRepository $repository)
    {
        $this->repository = $repository;
    }

    public function all()
    {
        return $this->repository->all();
    }

    public function find($id)
    {
        return $this->repository->find($id);
    }

    public function byUser($userId)
    {
        return $this->repository->byUser($userId);
    }

    public function byType($type)
    {
        return $this->repository->byType($type);
    }


    public function byGroup($groupId)
    {
        return $this->repository->byGroup($groupId);
    }

    public function repliesByUser($userId)
    {
        return $this->repository->repliesByUser($userId);
    }

    public function likedPostsByUser($userId)
    {
        return $this->repository->likedPostsByUser($userId);
    }

    public function create(array $input, array $media = [])
    {
        \Log::debug('PostService create input:', $input);
        \Log::debug('PostService create media:', $media);

        $input['content'] = isset($input['content']) ? trim($input['content']) : null;

        $validator = Validator::make($input, [
            'user_id' => 'required|exists:users,id',
            'group_id' => 'nullable|exists:groups,id',
            'parent_id' => 'nullable|exists:posts,id',
            'type' => 'nullable|string|max:50',
            'content' => 'nullable|string|max:2000',
        ]);

        if ($validator->fails()) {
            \Log::error('PostService validation failed:', $validator->errors()->toArray());
            throw new ValidationException($validator);
        }

        if (empty($input['content']) && empty($media)) {
            throw ValidationException::withMessages([
                'content' => 'Please provide text content or at least one media file.',
            ]);
        }

        // ✅ Check if group is soft-deleted (if post is for a group)
        if (!empty($input['group_id'])) {
            $group = Group::withTrashed()->find($input['group_id']);
            
            if (!$group) {
                throw ValidationException::withMessages([
                    'group_id' => 'The specified group does not exist.',
                ]);
            }
            
            // Check if group is soft-deleted
            if ($group->trashed() || $group->deleted_at !== null) {
                throw ValidationException::withMessages([
                    'group_id' => 'Cannot create post: This group has been deleted.',
                ]);
            }
        }

        // ✅ Filter out null/empty files first
        $media = array_filter($media, function ($file) {
            return $file !== null && $file !== false;
        });

        // ✅ Limit media count to 4
        if (count($media) > 4) {
            \Log::error('Too many media files in request:', ['count' => count($media)]);
            $validator = Validator::make([], []); // empty validator just to throw
            throw new ValidationException($validator, 'You can only upload up to 4 media files.');
        }

        // ✅ Validate each media file
        foreach ($media as $index => $file) {
            if (!$file instanceof \Illuminate\Http\UploadedFile) {
                \Log::error("Invalid file at index $index:", ['file' => $file, 'type' => gettype($file)]);
                throw new ValidationException(Validator::make([], []), "Invalid file at index $index");
            }

            $validator = Validator::make(['file' => $file], [
                'file' => 'required|file|mimes:jpg,jpeg,png,mp4|max:10240', // 10MB max
            ]);

            if ($validator->fails()) {
                \Log::error("Media validation failed at index $index:", $validator->errors()->toArray());
                throw new ValidationException($validator);
            }
        }

        // ✅ Create post
        $post = $this->repository->create($input);

        // ✅ Handle media uploads
        foreach ($media as $file) {
            if ($file && $file instanceof \Illuminate\Http\UploadedFile) {
                try {
                    $path = $file->store('media', 'public');

                    // Make absolute URL
                    $url = asset(Storage::url($path));

                    \Log::debug('Media stored:', ['path' => $path, 'url' => $url]);

                    $post->media()->create([
                        'url' => $url, // Full URL, not relative anymore
                    ]);
                } catch (\Exception $e) {
                    \Log::error('Failed to store media file:', [
                        'error' => $e->getMessage(),
                        'file' => $file->getClientOriginalName(),
                    ]);
                    throw new \Exception('Failed to upload media file: ' . $e->getMessage());
                }
            }
        }

        // ✅ Reload post with media
        return $post->load('media');
    }


    public function update(array $data)
    {
        $data['content'] = isset($data['content']) ? trim($data['content']) : null;

        $validator = Validator::make($data, [
            'id' => 'required|integer',
            'type' => 'nullable|string|max:50',
            'content' => 'nullable|string|max:2000',
            'media_url' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            throw new ValidationException($validator);
        }

        if (
            !array_key_exists('content', $data)
            && !array_key_exists('media_url', $data)
            && !array_key_exists('type', $data)
        ) {
            throw ValidationException::withMessages([
                'content' => 'No changes detected. Please provide a new value to update.',
            ]);
        }

        if (array_key_exists('content', $data) && $data['content'] === null && empty($data['media_url'])) {
            throw ValidationException::withMessages([
                'content' => 'Content cannot be empty unless you provide media.',
            ]);
        }

        // ✅ Check if post exists and if it's soft-deleted
        $post = Post::withTrashed()->find($data['id']);
        if (!$post) {
            throw ValidationException::withMessages([
                'id' => 'Post not found.',
            ]);
        }
        
        if ($post->trashed() || $post->deleted_at !== null) {
            throw ValidationException::withMessages([
                'id' => 'Cannot update post: This post has been deleted.',
            ]);
        }

        // ✅ Check if post belongs to a soft-deleted group
        if ($post->group_id) {
            $group = Group::withTrashed()->find($post->group_id);
            
            if ($group && ($group->trashed() || $group->deleted_at !== null)) {
                throw ValidationException::withMessages([
                    'group_id' => 'Cannot update post: This group has been deleted.',
                ]);
            }
        }

        return $this->repository->update($data['id'], $data);
    }

    public function delete($id)
    {
        try {
            return $this->repository->delete($id);
        } catch (\Exception $e) {
            throw ValidationException::withMessages([
                'post' => $e->getMessage(),
            ]);
        }
    }

    public function getPostsOfFollowing(array $followingIds)
    {
        // Business-rule: you can’t see posts from an empty list
        if (empty($followingIds)) {
            return collect();
        }

        return $this->repository->postsOfFollowing($followingIds);
    }
}
