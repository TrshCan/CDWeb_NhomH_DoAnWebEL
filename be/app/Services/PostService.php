<?php

namespace App\Services;

use App\Repositories\PostRepository;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

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

    public function byGroup($groupId)
    {
        return $this->repository->byGroup($groupId);
    }

    public function create(array $data)
    {
        $validator = Validator::make($data, [
            'user_id' => 'required|exists:users,id',
            'group_id' => 'nullable|exists:groups,id',
            'parent_id' => 'nullable|exists:posts,id',
            'type' => 'nullable|string|max:50',
            'content' => 'nullable|string',
            'media_url' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            throw new ValidationException($validator);
        }

        return $this->repository->create($data);
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
