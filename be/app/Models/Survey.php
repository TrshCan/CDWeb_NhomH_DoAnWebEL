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
        'status', // ✅ thêm dòng này
    ];


    protected $casts = [
        'start_at' => 'datetime',
        'end_at' => 'datetime',
    ];

    public function category()
    {
        return $this->belongsTo(Category::class, 'categories_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Accessor để lấy creator_name
     * Nếu đã có trong attributes (từ join query) thì dùng, nếu không thì load từ relationship
     */
    public function getCreatorNameAttribute()
    {
        // Nếu đã có creator_name từ join query (như trong getAllPaginated)
        if (isset($this->attributes['creator_name'])) {
            return $this->attributes['creator_name'];
        }

        // Nếu không có, load từ relationship
        if ($this->relationLoaded('creator')) {
            return $this->creator?->name;
        }

        // Load relationship nếu chưa được load
        return $this->creator?->name;
    }
}