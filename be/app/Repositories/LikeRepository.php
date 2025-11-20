<?php

namespace App\Repositories;

use App\Models\PostLike;

class LikeRepository
{
    public function toggle($postId, $userId)
    {
        $like = PostLike::where('post_id', $postId)
            ->where('user_id', $userId)
            ->first();

        if ($like) {
            $like->delete();
            return false; // Unliked
        } else {
            PostLike::create([
                'post_id' => $postId,
                'user_id' => $userId,
                'created_at' => now(),
            ]);
            return true; // Liked
        }
    }

    public function isLiked($postId, $userId)
    {
        return PostLike::where('post_id', $postId)
            ->where('user_id', $userId)
            ->exists();
    }

    public function getLikesCount($postId)
    {
        return PostLike::where('post_id', $postId)->count();
    }
}

