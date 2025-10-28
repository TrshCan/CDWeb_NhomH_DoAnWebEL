<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Survey extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'title',
        'description',
        'categories_id',
        'type',
        'start_at',
        'end_at',
        'time_limit',
        'points',
        'object',
        'created_by',
    ];

    protected $casts = [
        'start_at' => 'datetime',
        'end_at' => 'datetime',
    ];

    // // Quan hệ với Category
    // public function category()
    // {
    //     return $this->belongsTo(Category::class, 'categories_id');
    // }

    // Quan hệ với User (người tạo)
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}