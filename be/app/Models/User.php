<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Mail;

class User extends Authenticatable
{
    use HasFactory, Notifiable, SoftDeletes;

    protected $fillable = [
        'name',
        'email',
        'password',
        'phone',
        'address',
        'role',
        'class_id',
        'faculty_id',
        'status_id',
        'ban_reason',
        'point',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'point' => 'integer',
    ];

    // ============================
    // 🔹 RELATIONSHIPS
    // ============================

    // public function class()
    // {
    //     return $this->belongsTo(ClassModel::class, 'class_id');
    // }

    public function faculty()
    {
        return $this->belongsTo(Faculty::class, 'faculty_id');
    }

    public function status()
    {
        return $this->belongsTo(Status::class, 'status_id');
    }

    // Example: user has many posts
    public function posts()
    {
        return $this->hasMany(Post::class, 'user_id');
    }

    // Followers: những người theo dõi user này
    public function followers()
    {
        return $this->hasMany(Follow::class, 'followed_id')
            ->where('status', 'active');
    }

    // Following: những người mà user này đang theo dõi
    public function following()
    {
        return $this->hasMany(Follow::class, 'follower_id')
            ->where('status', 'active');
    }

    // Badges của user
    public function userBadges()
    {
        return $this->hasMany(UserBadge::class, 'user_id')
            ->whereNull('revoked_at')
            ->with('badge');
    }

    // ============================
    // 🔹 HELPER / LOGIC METHODS
    // ============================

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isLecturer(): bool
    {
        return $this->role === 'lecturer';
    }

    public function isStudent(): bool
    {
        return $this->role === 'student';
    }

    // ============================
    // 🔹 PASSWORD RESET
    // ============================

    /**
     * Send the password reset notification.
     * This follows industry standard by using Laravel's notification system
     * but with our custom email template.
     *
     * @param  string  $token
     * @param  string  $resetUrl
     * @return void
     */
    public function sendPasswordResetNotification($token, $resetUrl = null)
    {
        // If no custom URL provided, build the default one
        if (!$resetUrl) {
            $resetUrl = config('app.frontend_url', 'http://localhost:3000')
                      . '/reset-password?token=' . $token
                      . '&email=' . urlencode($this->email);
        }

        // Send email using our custom template
        Mail::send('emails.reset-password', [
            'user' => $this,
            'resetUrl' => $resetUrl,
            'token' => $token
        ], function ($message) {
            $message->to($this->email, $this->name)
                    ->subject('Đặt lại mật khẩu - TDC SocialSphere');
        });
    }
}
