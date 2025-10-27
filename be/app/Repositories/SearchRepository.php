<?php

namespace App\Repositories;

use App\Models\Post;
use App\Models\User;

class SearchRepository
{
    public function searchPosts(string $query)
    {
        return Post::where('content', 'like', "%{$query}%")->get();
    }

    public function searchUsers(string $query)
    {
        return User::where('name', 'like', "%{$query}%")->get();
    }
}
