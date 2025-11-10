<?php

namespace App\Repositories;

use App\Models\Post;

class PostRepository
{
    public function all()
    {
        return Post::with(['user', 'group', 'likes', 'shares', 'children'])
            ->latest()
            ->get();
    }

    public function find($id)
    {
        return Post::with(['user', 'group', 'likes', 'shares', 'children'])
            ->findOrFail($id);
    }

    public function byUser($userId)
    {
        return Post::where('user_id', $userId)
            ->with(['user', 'group', 'likes', 'shares', 'children'])
            ->latest()
            ->get();
    }

    public function byType($type)
    {
        return Post::with(['user'])
            ->where('type', $type)
            ->latest()
            ->get();
    }


    public function byGroup($groupId)
    {
        return Post::where('group_id', $groupId)
            ->with(['user', 'likes', 'shares', 'children'])
            ->latest()
            ->get();
    }


    public function create(array $data)
    {
        return Post::create($data);
    }

    public function update($id, array $data)
    {
        $post = Post::findOrFail($id);
        $post->update($data);
        return $post;
    }

    public function delete($id)
    {
        $post = Post::findOrFail($id);
        return $post->delete();
    }
}
