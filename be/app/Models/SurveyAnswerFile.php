<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SurveyAnswerFile extends Model
{
    use HasFactory;

    protected $fillable = [
        'answer_id',
        'file_path',
        'original_name',
        'file_size_kb',
        'mime_type',
    ];

    protected $casts = [
        'file_size_kb' => 'integer',
    ];

    // Relationships
    public function answer()
    {
        return $this->belongsTo(SurveyAnswer::class, 'answer_id');
    }
}
