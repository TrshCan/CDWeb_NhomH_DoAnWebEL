<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class GroupMember extends Model
{
    use SoftDeletes;

    protected $table = 'group_members';
    public $timestamps = false;

    protected $fillable = ['group_id', 'user_id', 'role', 'joined_at'];
    protected $casts = ['joined_at' => 'datetime'];

    public function group()
    {
        return $this->belongsTo(Group::class);
    }
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
