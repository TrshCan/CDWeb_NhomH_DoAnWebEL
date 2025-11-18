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
        'status',
        'allow_review', // ✅ thêm dòng này
    ];


    protected $casts = [
        'start_at' => 'datetime',
        'end_at' => 'datetime',
        'allow_review' => 'boolean',
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function questions()
    {
        return $this->hasMany(SurveyQuestion::class, 'survey_id');
    }
