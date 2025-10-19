<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

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

    public function class()
    {
        return $this->belongsTo(ClassModel::class, 'class_id');
    }

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
}
