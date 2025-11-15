<?php
namespace App\GraphQL\Resolvers;
use App\Services\UserServices;
use Illuminate\Support\Facades\Log;
use App\Models\User;

class UserResolver
{
    public function __construct(private UserServices $userService)
    {

    }
    public function publicProfile($_, array $args)
    {
        return $this->userService->getUserProfile($args['id']);
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

    public function forgotPassword($_, array $args)
    {
        return $this->userService->forgotPassword($args['email']);
    }

    public function resetPassword($_, array $args)
    {
        return $this->userService->resetPassword($args);
    }
    public function resendVerificationEmail($_, array $args): bool
    {
        return $this->userService->resendVerificationEmail($args['email']);
    }

    // Resolver cho stats
    public function stats(User $user)
    {
        return [
            'posts' => $user->posts()->count(),
            'followers' => $user->followers()->count(),
            'following' => $user->following()->count(),
        ];
    }

    // Resolver cho badges
    public function badges(User $user)
    {
        return $user->userBadges()->get()->map(function ($userBadge) {
            return [
                'name' => $userBadge->badge->name ?? '',
                'description' => $userBadge->badge->description ?? '',
                'created_at' => $userBadge->badge->created_at ?? null,
                'assigned_at' => $userBadge->assigned_at ?? null,
            ];
        })->toArray();
    }

    // Resolver cho status
    public function status(User $user)
    {
        return $user->status;
    }
}

?>
