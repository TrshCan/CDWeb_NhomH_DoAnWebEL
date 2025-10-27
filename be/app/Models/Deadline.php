<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Deadline extends Model
{
    use SoftDeletes;
    public $timestamps = false;

    protected $fillable = [
        'title',
        'deadline_date',
        'details',
        'created_by',
        'created_at',
    ];

    protected $dates = ['deadline_date', 'created_at', 'deleted_at'];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}