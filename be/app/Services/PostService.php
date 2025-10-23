<?php

namespace App\Services;

use App\Repositories\PostRepository;
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

    public function create(array $input, array $media = [])
    {
        \Log::debug('PostService create input:', $input);
        \Log::debug('PostService create media:', $media);

        $validator = Validator::make($input, [
            'user_id' => 'required|exists:users,id',
            'group_id' => 'nullable|exists:groups,id',
            'parent_id' => 'nullable|exists:posts,id',
            'type' => 'nullable|string|max:50',
            'content' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            \Log::error('PostService validation failed:', $validator->errors()->toArray());
            throw new ValidationException($validator);
        }

        // Validate media files
        foreach ($media as $index => $file) {
            if ($file && !$file instanceof \Illuminate\Http\UploadedFile) {
                \Log::error("Invalid file at index $index:", ['file' => $file]);
                throw new ValidationException(Validator::make([], []), "Invalid file at index $index");
            }
            $validator = Validator::make(['file' => $file], [
                'file' => 'nullable|file|mimes:jpg,jpeg,png,mp4|max:10240', // 10MB max
            ]);
            if ($validator->fails()) {
                \Log::error("Media validation failed at index $index:", $validator->errors()->toArray());
                throw new ValidationException($validator);
            }
        }

        // Create the post
        $post = $this->repository->create($input);

        // Handle media uploads
        foreach ($media as $file) {
            if ($file instanceof \Illuminate\Http\UploadedFile) {
                $path = $file->store('media', 'public');
                \Log::debug('Media stored:', ['path' => $path, 'url' => Storage::url($path)]);
                $post->media()->create([
                    'url' => Storage::url($path),
                ]);
            }
        }

        // Reload post with media relationship
        return $post->load('media');
    }

    public function update(array $data)
    {
        $validator = Validator::make($data, [
            'id' => 'required|exists:posts,id',
            'type' => 'nullable|string|max:50',
            'content' => 'nullable|string',
            'media_url' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            throw new ValidationException($validator);
        }

        return $this->repository->update($data['id'], $data);
    }

    public function delete($id)
    {
        return $this->repository->delete($id);
    }
}
