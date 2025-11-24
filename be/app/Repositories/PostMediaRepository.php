<?php

namespace App\Repositories;

use App\Models\PostMedia;

class PostMediaRepository
{
    protected $model;

    public function __construct(PostMedia $model)
    {
        $this->model = $model;
    }

    public function create($data)
    {
        return $this->model->create($data);
    }
}
