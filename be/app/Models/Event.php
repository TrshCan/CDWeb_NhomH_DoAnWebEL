<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Event extends Model
{
    use SoftDeletes;

    public $timestamps = false; // vì chỉ có created_at, không có updated_at

    protected $fillable = [
        'title',
        'event_date',
        'location',
        'created_by',
        'created_at'
    ];
}