<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Permission extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = ['name', 'description'];

    public function users()
    {
        return $this->belongsToMany(User::class, 'user_permissions')
            ->withPivot(['granted_at', 'granted_by']);
    }

    public function roleDefaults()
    {
        return $this->hasMany(RoleDefaultPermission::class, 'permission_id');
    }
}
