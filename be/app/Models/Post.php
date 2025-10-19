<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Post extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'group_id',
        'parent_id',
        'type',
        'content',
        'media_url'
    ];

    protected $casts = [
        'type' => 'string',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
    public function group()
    {
        return $this->belongsTo(Group::class);
    }
    public function parent()
    {
        return $this->belongsTo(Post::class, 'parent_id');
    }
    public function children()
    {
        return $this->hasMany(Post::class, 'parent_id');
    }

    public function likes()
    {
        return $this->hasMany(PostLike::class);
    }
    public function shares()
    {
        return $this->hasMany(PostShare::class);
    }

    public function groupPosts()
    {
        return $this->hasMany(GroupPost::class);
    }
    public function groups()
    {
        return $this->belongsToMany(Group::class, 'group_posts')
            ->withPivot(['sender_id', 'sent_at']);
    }

    public function images()
    {
        return $this->hasMany(PostImage::class);
    }

}
