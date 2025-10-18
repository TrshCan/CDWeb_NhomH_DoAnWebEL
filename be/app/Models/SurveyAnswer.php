<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class SurveyAnswer extends Model
{
    use SoftDeletes;

    protected $table = 'survey_answers';
    public $timestamps = false;

    protected $fillable = [
        'question_id',
        'user_id',
        'selected_option_id',
        'answer_text',
        'answered_at',
        'score'
    ];
    protected $casts = [
        'answered_at' => 'datetime',
        'score' => 'integer',
    ];

    public function question()
    {
        return $this->belongsTo(SurveyQuestion::class, 'question_id');
    }
    public function user()
    {
        return $this->belongsTo(User::class);
    }
    public function selectedOption()
    {
        return $this->belongsTo(SurveyOption::class, 'selected_option_id');
    }
}