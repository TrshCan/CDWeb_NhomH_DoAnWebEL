<?php

namespace App\Services;

use App\Repositories\LikeRepository;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class LikeService
{
    protected $repository;

    public function __construct(LikeRepository $repository)
    {
        $this->repository = $repository;
    }

    public function toggle($postId, $userId)
    {
        $validator = Validator::make([
            'post_id' => $postId,
            'user_id' => $userId,
        ], [
            'post_id' => 'required|exists:posts,id',
            'user_id' => 'required|exists:users,id',
        ]);

        if ($validator->fails()) {
            throw new ValidationException($validator);
        }

        return $this->repository->toggle($postId, $userId);
    }

    public function isLiked($postId, $userId)
    {
        return $this->repository->isLiked($postId, $userId);
    }

    public function getLikesCount($postId)
    {
        return $this->repository->getLikesCount($postId);
    }
}

