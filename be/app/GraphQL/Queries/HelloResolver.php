<?php

namespace App\GraphQL\Queries;

class HelloResolver
{
    public function __invoke($_, array $args)
    {
        return "Hello from GraphiQL!";
    }
}

