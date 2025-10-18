<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Event extends Model
{
    use SoftDeletes;

    public $timestamps = false;

    protected $fillable = ['title', 'event_date', 'location', 'created_at', 'created_by'];
    protected $casts = [
        'event_date' => 'date',
        'created_at' => 'datetime',
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
