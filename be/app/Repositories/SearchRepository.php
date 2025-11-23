<?php

namespace App\Repositories;

use App\Models\Post;
use App\Models\User;

class SearchRepository
{
    protected $post;
    protected $user;

    public function __construct(Post $post, User $user)
    {
        $this->post = $post;
        $this->user = $user;
    }

    public function searchPosts(string $query): \Illuminate\Database\Eloquent\Collection
    {
        return $this->post->where('content', 'LIKE', "%{$query}%")->get();
    }

    public function searchUsers(string $query): \Illuminate\Database\Eloquent\Collection
    {
        return $this->user->where('name', 'LIKE', "%{$query}%")->get();
    }
}
