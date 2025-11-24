<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SurveyQuestion extends Model
{
    protected $table = 'survey_questions';
    public $timestamps = false;

    protected $fillable = ['survey_id', 'question_text', 'question_type', 'points'];
    use HasFactory;

    protected $casts = [
        'points' => 'integer',
    ];

    public function survey()
    {
        return $this->belongsTo(Survey::class);
    }
    public function options()
    {
        return $this->hasMany(SurveyOption::class, 'question_id');
    }
    public function answers()
    {
        return $this->hasMany(SurveyAnswer::class, 'question_id');
    }
}
