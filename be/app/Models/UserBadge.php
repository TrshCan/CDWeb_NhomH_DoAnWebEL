<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserBadge extends Model
{
    protected $table = 'user_badges';
    public $timestamps = false;

    protected $fillable = ['user_id', 'badge_id', 'assigned_by', 'assigned_at', 'revoked_at'];
    protected $casts = [
        'assigned_at' => 'datetime',
        'revoked_at'  => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
    public function badge()
    {
        return $this->belongsTo(Badge::class);
    }
    public function assigner()
    {
        return $this->belongsTo(User::class, 'assigned_by');
    }
}
