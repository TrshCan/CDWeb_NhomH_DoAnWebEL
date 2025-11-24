<?php

namespace App\GraphQL\Queries;

class EmptyResolver
{
    public function __invoke($_, array $args = [])
    {
        return "";
    }
}

