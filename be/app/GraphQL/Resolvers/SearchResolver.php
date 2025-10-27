<?php
// app/GraphQL/Resolvers/SearchResolver.php
namespace App\GraphQL\Resolvers;

use App\Models\Post;
use App\Models\User;

class SearchResolver
{
    public function __invoke($_, array $args)
    {
        $query = $args['query'];

        return [
            'posts' => Post::where('content', 'like', "%{$query}%")->get(),
            'users' => User::where('name', 'like', "%{$query}%")->get(),
        ];
    }
}
