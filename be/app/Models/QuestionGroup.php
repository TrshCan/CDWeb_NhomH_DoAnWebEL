<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class QuestionGroup extends Model
{
    protected $fillable = [
        'survey_id',
        'title',
        'position',
    ];

    protected $casts = [
        'position' => 'integer',
    ];

    /**
     * Relationship: QuestionGroup belongs to Survey
     */
    public function survey()
    {
        return $this->belongsTo(Survey::class);
    }

    /**
     * Relationship: QuestionGroup has many Questions
     */
    public function questions()
    {
        return $this->hasMany(SurveyQuestion::class, 'group_id')->orderBy('position');
    }
}
