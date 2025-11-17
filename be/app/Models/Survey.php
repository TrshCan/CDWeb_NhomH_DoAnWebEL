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
        'status',
        'allow_review',
        'created_by',
    ];

    protected $casts = [
        'start_at' => 'datetime',
        'end_at' => 'datetime',
        'time_limit' => 'integer',
        'points' => 'integer',
        'allow_review' => 'boolean',
    ];

    // Relationships
    public function category()
    {
        return $this->belongsTo(Category::class, 'categories_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function questions()
    {
        return $this->hasMany(SurveyQuestion::class)->orderBy('id');
    }

    public function answers()
    {
        return $this->hasManyThrough(SurveyAnswer::class, SurveyQuestion::class);
    }

    public function results()
    {
        return $this->hasMany(SurveyResult::class);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopePublic($query)
    {
        return $query->where('object', 'public');
    }

    public function scopeForStudents($query)
    {
        return $query->where('object', 'students');
    }

    public function scopeForLecturers($query)
    {
        return $query->where('object', 'lecturers');
    }
}
