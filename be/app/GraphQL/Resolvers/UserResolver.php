<?php
namespace App\GraphQL\Resolvers;
use App\Services\UserServices;
use Illuminate\Support\Facades\Log;
class UserResolver
{
    public function __construct(private UserServices $userService)
    {

    }

    public function loginUser($_, array $args)
    {
        return $this->userService->loginUser($args['email'], $args['password']);

        }
        public function registerUser($_, array $args)
        {
            $result = $this->userService->registerUser($args);
            $user = $result['user'];
            Log::info('Created user', $user->toArray());
            return $user;
        }
    }

?>
