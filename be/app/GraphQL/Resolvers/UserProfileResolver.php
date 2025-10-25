<?php
namespace App\GraphQL\Resolvers;
use App\Services\UserProfileServices;
use Illuminate\Support\Facades\Log;

class UserProfileResolver{
    public function __construct(private UserProfileServices $userProfileService)
    {

    }
    public function publicProfile($root, array $args)
    {
        $id = $args['id'];
        return $this->userProfileService->getPublicProfileById($id);
    }


}

?>
