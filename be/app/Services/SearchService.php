<?php

namespace App\Services;

use App\Repositories\SearchRepository;

class SearchService
{
    protected $repo;

    public function __construct(SearchRepository $repo)
    {
        $this->repo = $repo;
    }

    public function search(string $query): array
    {
        // Could add more complex logic later like ranking, fuzzy search, etc.
        $posts = $this->repo->searchPosts($query);
        $users = $this->repo->searchUsers($query);

        // You can modify or filter results here if needed
        return [
            'posts' => $posts,
            'users' => $users,
        ];
    }
}
