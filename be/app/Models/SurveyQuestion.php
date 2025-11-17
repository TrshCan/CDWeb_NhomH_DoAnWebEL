<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SurveyQuestion extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'survey_id',
        'question_code',
        'question_text',
        'image',
        'question_type',
        'required',
        'conditions',
        'default_scenario',
        'max_length',
        'numeric_only',
        'max_questions',
        'allowed_file_types',
        'max_file_size_kb',
        'help_text',
        'points',
    ];

    protected $casts = [
        'conditions' => 'array',
        'default_scenario' => 'integer',
        'max_length' => 'integer',
        'numeric_only' => 'boolean',
        'max_questions' => 'integer',
        'max_file_size_kb' => 'integer',
        'points' => 'integer',
    ];

    // Relationships
    public function survey()
    {
        return $this->belongsTo(Survey::class);
    }

    public function options()
    {
        return $this->hasMany(SurveyOption::class, 'question_id')->orderBy('position');
    }

    public function answers()
    {
        return $this->hasMany(SurveyAnswer::class, 'question_id');
    }

    // Helper methods
    public function isRequired()
    {
        return in_array($this->required, ['soft', 'hard']);
    }

    public function hasConditions()
    {
        return !empty($this->conditions);
    }

    public function allowsMultipleAnswers()
    {
        return in_array($this->question_type, [
            'Nhiều lựa chọn',
            'Lựa chọn 5 điểm',
            'Chọn nhiều hình ảnh'
        ]);
    }
}
