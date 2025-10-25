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
        $user->name = $data['name'];
        $user->email = $data['email'];
        $user->phone =$data['phone'];
        $user->address =$data['address'];
        $user->password = Hash::make($data['password']);
        $user->status_id   = $data['status_id'] ?? 1;
        $user->role        = $data['role']        ?? 'student';
        $user->class_id    = $data['class_id']    ?? null;
        $user->faculty_id  = $data['faculty_id']  ?? null;
        $user->ban_reason  = $data['ban_reason']  ?? null;
        $user->point       = $data['point']       ?? 0;
        $user->email_verified_at = null;
        $user->avatar      = $data['avatar']   ?? 'default.png';
        $user->save();
        $user->refresh();
        return $user;
    }

}
?>
