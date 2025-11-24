<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Category extends Model
{
    use HasFactory, SoftDeletes;
protected $table = 'categories';
    protected $fillable = [
        'id',
        'name',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    public $incrementing = false;
    protected $keyType = 'integer';

    // Relationships
    public function surveys()
    {
        return $this->hasMany(Survey::class, 'categories_id');
    }
}
