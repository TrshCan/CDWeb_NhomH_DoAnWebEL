<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Group extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = ['name', 'description', 'created_by'];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
    public function members()
    {
        return $this->hasMany(GroupMember::class);
    }
    public function posts()
    {
        return $this->hasMany(Post::class);
    }
    public function groupPosts()
    {
        return $this->hasMany(GroupPost::class);
    }

    public function users()
    {
        return $this->belongsToMany(User::class, 'group_members')
            ->withPivot(['role', 'joined_at'])
            ->withTimestamps(); // group_members có softDeletes nhưng không có created/updated; nếu không muốn timestamps thì bỏ dòng này.
    }
}
