<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class GroupPost extends Model
{
    use SoftDeletes;

    protected $table = 'group_posts';
    public $timestamps = false;

    protected $fillable = ['group_id', 'sender_id', 'post_id', 'sent_at'];
    protected $casts = ['sent_at' => 'datetime'];

    public function group()
    {
        return $this->belongsTo(Group::class);
    }
    public function sender()
    {
        return $this->belongsTo(User::class, 'sender_id');
    }
    public function post()
    {
        return $this->belongsTo(Post::class);
    }
}
