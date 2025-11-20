<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SurveyAnswerOption extends Model
{
    protected $table = 'survey_answer_options';

    protected $fillable = [
        'answer_id',
        'option_id',
    ];

    public function answer()
    {
        return $this->belongsTo(SurveyAnswer::class, 'answer_id');
    }

    public function option()
    {
        return $this->belongsTo(SurveyOption::class, 'option_id');
    }
}


