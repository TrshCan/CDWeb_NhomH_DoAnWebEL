<?php

namespace App\GraphQL\Queries;

class HelloQuery
{
    public function __invoke($_, array $args)
    {
        return "Hello GraphQL!";
    }
}
