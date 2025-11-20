<?php

namespace App\Repositories;

use App\Models\PostMedia;

class PostMediaRepository
{
    public function create($data)
    {
        return PostMedia::create($data);
    }
}
