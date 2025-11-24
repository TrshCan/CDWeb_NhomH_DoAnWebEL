<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class SurveyAnswer extends Model
{
    protected $table = 'survey_answers';
    public $timestamps = false;
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'question_id',
        'user_id',
        'selected_option_id',
        'answer_text',
        'comment_text',
        'matrix_answer',
        'file_urls',
        'answered_at',
        'score',
    ];

    protected $casts = [
        'matrix_answer' => 'array',
        'file_urls' => 'array',
        'answered_at' => 'datetime',
        'score' => 'integer',
    ];

    // Relationships
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

    public function optionSelections()
    {
        return $this->hasMany(SurveyAnswerOption::class, 'answer_id');
        }
    public function selectedOptions()
    {
        return $this->belongsToMany(
            SurveyOption::class,
            'survey_answer_options',
            'answer_id',
            'option_id'
        )->withTimestamps();
    }

    public function files()
    {
        return $this->hasMany(SurveyAnswerFile::class, 'answer_id');
    }
}
