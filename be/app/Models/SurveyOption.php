<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SurveyOption extends Model
{
    use HasFactory;

    public $timestamps = false;
protected $table = 'survey_options';
    protected $fillable = [
        'question_id',
        'option_text',
        'image',
        'is_subquestion',
        'position',
        'is_correct',
    ];

    protected $casts = [
        'is_subquestion' => 'boolean',
        'position' => 'integer',
        'is_correct' => 'boolean',
    ];

    protected $attributes = [
        'is_subquestion' => false,
        'is_correct' => false,
    ];

    // Relationships
    public function question()
    {
        return $this->belongsTo(SurveyQuestion::class, 'question_id');
    }

    public function answers()
    {
        return $this->hasMany(SurveyAnswer::class, 'selected_option_id');
    }

    // Scopes
    public function scopeSubquestions($query)
    {
        return $query->where('is_subquestion', true);
    }

    public function scopeRegularOptions($query)
    {
        return $query->where('is_subquestion', false);
    }

    public function scopeCorrect($query)
    {
        return $query->where('is_correct', true);
    }
}
