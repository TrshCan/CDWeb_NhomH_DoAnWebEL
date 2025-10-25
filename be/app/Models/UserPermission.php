<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserPermission extends Model
{
    protected $table = 'user_permissions';
    public $timestamps = false;

    protected $fillable = ['user_id', 'permission_id', 'granted_at', 'granted_by'];
    protected $casts = ['granted_at' => 'datetime'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
    public function permission()
    {
        return $this->belongsTo(Permission::class);
    }
    public function granter()
    {
        return $this->belongsTo(User::class, 'granted_by');
    }
}
