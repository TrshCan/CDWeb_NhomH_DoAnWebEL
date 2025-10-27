<?php

namespace App\GraphQL\Mutations;

use App\Services\PostMediaService;

class PostMediaResolver
{
    protected $postMediaService;

    public function __construct(PostMediaService $postMediaService)
    {
        $this->postMediaService = $postMediaService;
    }

    public function uploadPostMedia($_, array $args)
    {
        $file = $args['file'];
        $postId = $args['post_id'] ?? null;

        return $this->postMediaService->uploadMedia($file, $postId);
    }
}
