<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class RoleDefaultPermission extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'role_default_permissions';

    protected $fillable = ['role', 'permission_id'];

    public function permission()
    {
        return $this->belongsTo(Permission::class);
    }
}
