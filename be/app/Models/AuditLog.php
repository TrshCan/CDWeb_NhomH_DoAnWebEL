<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'survey_id',
        'user_id',
        'user_name',
        'action',
        'entity_type',
        'entity_id',
        'details',
        'ip_address',
        'user_agent',
        'created_at',
    ];

    protected $casts = [
        'created_at' => 'datetime',
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

    // Helper method để tạo log
    public static function log($surveyId, $action, $entityType, $entityId = null, $details = null)
    {
        return self::create([
            'survey_id' => $surveyId,
            'user_id' => auth()->id(),
            'user_name' => auth()->user()->name ?? 'Guest',
            'action' => $action,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'details' => is_array($details) ? json_encode($details) : $details,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'created_at' => now(),
        ]);
    }
}
