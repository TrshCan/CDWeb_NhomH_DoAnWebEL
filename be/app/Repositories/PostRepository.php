<?php

namespace App\Repositories;

use App\Models\Post;

class PostRepository
{
    public function all()
    {
        return Post::with(['user', 'group', 'likes.user', 'shares', 'children.user', 'children.likes.user', 'media'])
            ->whereNull('parent_id')
            ->latest()
            ->get();
    }

    public function find($id)
    {
        return Post::with([
            'user',
            'group',
            'likes.user',
            'shares',
            'children.user',
            'children.likes.user',
            'children.media',
            'children.children.user',
            'children.children.likes.user',
            'children.children.media',
            'children.children.parent.user',
            'parent.user',
            'media'
        ])
            ->findOrFail($id);
    }

    public function byUser($userId)
    {
        return Post::where('user_id', $userId)
            ->with(['user', 'group', 'likes.user', 'shares', 'children.user', 'children.likes.user', 'parent.user', 'media'])
            ->latest()
            ->get();
    }

    public function byType($type)
    {
        return Post::with(['user', 'likes.user', 'media'])
            ->where('type', $type)
            ->whereNull('parent_id')
            ->latest()
            ->get();
    }


    public function byGroup($groupId)
    {
        return Post::where('group_id', $groupId)
            ->with(['user', 'likes.user', 'shares', 'children.user', 'children.likes.user', 'media'])
            ->whereNull('parent_id')
            ->latest()
            ->get();
    }

    public function repliesByUser($userId)
    {
        return Post::where('user_id', $userId)
            ->whereNotNull('parent_id')
            ->with(['user', 'parent.user', 'likes.user', 'media'])
            ->latest()
            ->get();
    }

    public function likedPostsByUser($userId)
    {
        return Post::whereHas('likes', function ($query) use ($userId) {
            $query->where('user_id', $userId);
        })
            ->with(['user', 'likes.user', 'media', 'parent.user'])
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

    public function postsOfFollowing(array $followingIds)
    {
        if (empty($followingIds)) {
            return collect();               // empty collection → no DB hit
        }

        return Post::with(['user', 'likes.user', 'media'])
            ->whereIn('user_id', $followingIds)
            ->whereNull('parent_id')        // only root posts
            ->latest()
            ->get();
    }
}
