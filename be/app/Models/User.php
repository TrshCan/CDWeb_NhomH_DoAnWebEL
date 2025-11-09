<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\DB;

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
        'student_code',
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
    // 🔹 BOOT METHOD - Auto-generate student_code
    // ============================

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($user) {
            // Auto-generate student_code for students
            if ($user->role === 'student' && empty($user->student_code) && $user->faculty_id) {
                $user->student_code = static::generateStudentCode($user->faculty_id);
            }
        });
    }

    // ============================
    // 🔹 HELPER / LOGIC METHODS
    // ============================

    /**
     * Generate a unique student code
     * Format: [last 2 digits of year]211[faculty code][4 random unique numbers]
     * Example: 23211TT4535
     */
    public static function generateStudentCode(int $facultyId): string
    {
        // Get faculty code
        $faculty = Faculty::find($facultyId);
        if (!$faculty || !$faculty->code) {
            throw new \Exception("Faculty not found or has no code for faculty_id: {$facultyId}");
        }

        $facultyCode = strtoupper($faculty->code);
        
        // Get last 2 digits of current year
        // First year is 2023, so minimum year part is 23
        $currentYear = (int) date('Y');
        $yearPart = max(23, (int) substr($currentYear, -2));
        $yearPart = str_pad((string) $yearPart, 2, '0', STR_PAD_LEFT);

        // Generate unique 4-digit number
        $maxAttempts = 100;
        $attempt = 0;

        do {
            $randomPart = str_pad((string) rand(0, 9999), 4, '0', STR_PAD_LEFT);
            $studentCode = $yearPart . '211' . $facultyCode . $randomPart;

            // Check if this code already exists
            $exists = static::where('student_code', $studentCode)->exists();
            $attempt++;

            if ($attempt >= $maxAttempts) {
                throw new \Exception("Could not generate unique student code after {$maxAttempts} attempts");
            }
        } while ($exists);

        return $studentCode;
    }

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
