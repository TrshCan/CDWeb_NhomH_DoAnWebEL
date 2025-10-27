<?php

namespace App\GraphQL\Resolvers;

use App\Services\SearchService;

class SearchResolver
{
    protected $service;

    public function __construct(SearchService $service)
    {
        $this->service = $service;
    }

    public function __invoke($_, array $args)
    {
        $query = $args['query'] ?? '';
        return $this->service->search($query);
    }
}
