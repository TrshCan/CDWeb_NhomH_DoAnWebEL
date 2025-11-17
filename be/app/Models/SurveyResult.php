<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SurveyResult extends Model
{
    use HasFactory;

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

    // Relationships
    public function survey()
    {
        return $this->belongsTo(Survey::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Helper methods
    public function isCompleted()
    {
        return $this->status === 'completed';
    }

    public function getPercentage()
    {
        if ($this->max_score === 0) {
            return 0;
        }
        return round(($this->total_score / $this->max_score) * 100, 2);
    }
}
