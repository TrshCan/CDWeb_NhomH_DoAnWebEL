<?php

namespace App\Services;

use App\Repositories\SearchRepository;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class SearchService
{
    protected $repo;

    public function __construct(SearchRepository $repo)
    {
        $this->repo = $repo;
    }

    public function search(string $query): array
    {
        $query = trim($query);

        $validator = Validator::make(
            ['query' => $query],
            ['query' => 'required|string|min:2|max:100']
        );

        if ($validator->fails()) {
            throw new ValidationException($validator);
        }

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
