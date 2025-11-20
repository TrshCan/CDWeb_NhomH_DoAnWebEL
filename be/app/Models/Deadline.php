<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Deadline extends Model
{
    use SoftDeletes;

    public $timestamps = false;

    protected $fillable = ['title', 'deadline_date', 'details', 'created_at', 'created_by'];
    protected $casts = [
        'deadline_date' => 'date',
        'created_at' => 'datetime',
    ];

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

}
