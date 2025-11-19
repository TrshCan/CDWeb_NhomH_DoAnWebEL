<?php

namespace App\Repositories;

use App\Models\Post;

class PostRepository
{
    protected $model;

    public function __construct(Post $model)
    {
        $this->model = $model;
    }

    public function all()
    {
        return $this->model->with(['user', 'group', 'likes', 'shares', 'children'])
            ->latest()
            ->get();
    }

    public function find($id)
    {
        return $this->model->with(['user', 'group', 'likes', 'shares', 'children'])
            ->findOrFail($id);
    }

    public function byUser($userId)
    {
        return $this->model->where('user_id', $userId)
            ->with(['user', 'group', 'likes', 'shares', 'children'])
            ->latest()
            ->get();
    }

    public function byType($type)
    {
        return $this->model->with(['user'])
            ->where('type', $type)
            ->latest()
            ->get();
    }

    public function byGroup($groupId)
    {
        return $this->model->where('group_id', $groupId)
            ->with(['user', 'likes', 'shares', 'children'])
            ->latest()
            ->get();
    }

    public function create(array $data)
    {
        return $this->model->create($data);
    }

    public function update($id, array $data)
    {
        $post = $this->model->findOrFail($id);
        $post->update($data);
        return $post;
    }

    public function delete($id)
    {
        $post = $this->model->findOrFail($id);
        return $post->delete();
    }
}
