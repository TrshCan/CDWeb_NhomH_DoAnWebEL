<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SurveyOption extends Model
{
    protected $table = 'survey_options';
    public $timestamps = false;

    protected $fillable = ['question_id', 'option_text', 'is_correct'];
    protected $casts = ['is_correct' => 'boolean'];

    public function question()
    {
        return $this->belongsTo(SurveyQuestion::class, 'question_id');
    }
    public function answers()
    {
        return $this->hasMany(SurveyAnswer::class, 'selected_option_id');
    }
}