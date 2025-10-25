<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Follow extends Model
{
    protected $table = 'follows';
    public $timestamps = false;

    protected $fillable = ['follower_id', 'followed_id', 'status', 'created_at'];
    protected $casts = ['created_at' => 'datetime'];

    public function follower()
    {
        return $this->belongsTo(User::class, 'follower_id');
    }
    public function followed()
    {
        return $this->belongsTo(User::class, 'followed_id');
    }
}
