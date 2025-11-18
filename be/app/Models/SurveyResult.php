<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SurveyResult extends Model
{
    protected $table = 'survey_results';

    protected $fillable = [
        'survey_id',
        'user_id',
        'total_score',
        'max_score',
        'status',
    ];

    protected $casts = [
        'total_score' => 'integer',
        'max_score' => 'integer',
    ];

    public function survey()
    {
        return $this->belongsTo(Survey::class, 'survey_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}


