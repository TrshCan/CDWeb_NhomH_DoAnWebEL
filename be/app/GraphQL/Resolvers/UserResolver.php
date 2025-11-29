<?php
namespace App\GraphQL\Resolvers;
use App\Services\UserServices;
use Illuminate\Support\Facades\Log;
use App\Models\User;
use Illuminate\Validation\ValidationException;

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
                'id' => (string) $userBadge->id,
                'badge_id' => (string) ($userBadge->badge_id ?? ''),
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

    // Resolver for toggle follow/unfollow
    public function toggleFollow($_, array $args)
    {
        try {
            return $this->userService->toggleFollow($args['follower_id'], $args['followed_id']);
        } catch (ValidationException $e) {
            // Re-throw validation exceptions as-is (GraphQL will handle them properly)
            throw $e;
        } catch (\Exception $e) {
            // For other exceptions, wrap in ValidationException to ensure message is exposed
            Log::error('UserResolver toggleFollow error:', [
                'message' => $e->getMessage(),
                'follower_id' => $args['follower_id'] ?? null,
                'followed_id' => $args['followed_id'] ?? null,
            ]);
            throw ValidationException::withMessages([
                'followed_id' => $e->getMessage() ?: 'Failed to toggle follow status',
            ]);
        }
    }
    // Resolver for following
    public function following(User $user)
    {
        return $user->following()->pluck('followed_id')->toArray();
    }
}


?>