<?php

namespace App\Services;

use App\Repositories\UserProfileRepository;
use Illuminate\Validation\ValidationException;

class UserProfileServices
{


    public function __construct(private UserProfileRepository $userProfileRepository)
    {

    }

    /**
     * Lấy trang cá nhân công khai theo ID
     */
    public function getPublicProfileById(int $id)
    {
        $user = $this->userProfileRepository->getPublicProfileById($id);

        if (!$user) {
            throw ValidationException::withMessages([
                'user' => 'Không tìm thấy người dùng này hoặc tài khoản không tồn tại.'
            ]);
        }

        return $user;
    }

    /**
     * Lấy trang cá nhân công khai theo slug
     */

}
