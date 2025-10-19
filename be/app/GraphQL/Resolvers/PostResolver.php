<?php

namespace App\GraphQL\Resolvers;

use App\Services\PostService;

class PostResolver
{
    protected $service;

    public function __construct(PostService $service)
    {
        $this->service = $service;
    }

    public function all()
    {
        return $this->service->all();
    }

    public function find($root, array $args)
    {
        return $this->service->find($args['id']);
    }

    public function byUser($root, array $args)
    {
        return $this->service->byUser($args['user_id']);
    }

    public function byType($root, array $args)
    {
        return $this->service->byType($args['type']);
    }


    public function byGroup($root, array $args)
    {
        return $this->service->byGroup($args['group_id']);
    }

    public function create($root, array $args)
    {
        return $this->service->create($args['input']);
    }

    public function update($root, array $args)
    {
        return $this->service->update($args['input']);
    }

    public function delete($root, array $args)
    {
        return $this->service->delete($args['id']);
    }
}
