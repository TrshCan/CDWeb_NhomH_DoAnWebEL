<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Category extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = ['id', 'name'];
    protected $keyType = 'int';
    public $incrementing = false; // PK smallint tự set, nhưng không auto-increment theo migration
    public function surveys()
    {
        return $this->hasMany(Survey::class, 'categories_id');
    }
}
