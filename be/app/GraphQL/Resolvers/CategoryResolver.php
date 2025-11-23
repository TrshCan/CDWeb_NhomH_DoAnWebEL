<?php

namespace App\GraphQL\Resolvers;

use App\Models\Category;

class CategoryResolver
{
    public function list()
    {
        return Category::orderBy('id', 'asc')->get();
    }
}
