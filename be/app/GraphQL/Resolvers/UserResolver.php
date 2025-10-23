<?php
namespace App\GraphQL\Resolvers;
use App\Services\UserService;
class UserResolver{
    public function __construct(private UserService $userService)
    {
        $this->userService = $userService;
    }
    public function loginUser($_, array $args)
    {
        return $this->userService->loginUser($args['email'], $args['password']);
    }

}

?>
