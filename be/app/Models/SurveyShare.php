<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class SurveyShare extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'survey_id',
        'share_type',
        'share_token',
        'email',
        'group_id',
        'status',
        'sent_at',
        'completed_at',
        'created_by',
    ];

    protected $casts = [
        'sent_at' => 'datetime',
        'completed_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Relationships
    public function survey()
    {
        return $this->belongsTo(Survey::class);
    }

    // Tạm thời comment relationship này vì chưa có model Group
    // public function group()
    // {
    //     return $this->belongsTo(\App\Models\Group::class);
    // }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // Helper methods
    public static function generateToken()
    {
        return Str::random(32);
    }

    public function getShareUrl()
    {
        $baseUrl = config('app.url');
        return "{$baseUrl}/survey/{$this->survey_id}/participate?token={$this->share_token}";
    }

    // Scopes
    public function scopePublic($query)
    {
        return $query->where('share_type', 'public');
    }

    public function scopeEmail($query)
    {
        return $query->where('share_type', 'email');
    }

    public function scopeGroup($query)
    {
        return $query->where('share_type', 'group');
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }
}
