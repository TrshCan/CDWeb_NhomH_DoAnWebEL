<?php
namespace App\Repositories;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
class UserRepository {
    public function findByEmail(string $email): ?User
    {
        return User::where('email', $email)->first();
    }
    public function findByPhone(string $phone): ?User
    {
        return User::where('phone', $phone)->first();
    }
    public function registerUser(array $data): User
    {
        $user = new User($data);
        $user->email = $data['email'];
        $user->phone =$data['phone'];
        $user->address =$data['address'];
        $user->password = Hash::make($data['password']);
        $user->status_id = 1;
        $user->save();
        $user->refresh();
        return $user;
    }

}
?>
