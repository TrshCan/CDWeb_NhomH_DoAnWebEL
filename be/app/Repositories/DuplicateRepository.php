<?php

namespace App\Repositories;

use App\Models\Survey;
use Illuminate\Database\Eloquent\ModelNotFoundException;

/**
 * Repository xử lý truy vấn database cho chức năng duplicate survey
 */
class DuplicateRepository
{
    /**
     * Lấy survey theo ID (không load relations)
     * 
     * @param int $id ID của survey
     * @return Survey Survey được tìm thấy
     * @throws ModelNotFoundException Khi không tìm thấy survey
     */
    public function findById(int $id): Survey
    {
        return Survey::findOrFail($id);
    }

    /**
     * Lấy survey theo ID cùng với questions và options
     * 
     * @param int $id ID của survey
     * @return Survey Survey với relations
     * @throws ModelNotFoundException Khi không tìm thấy survey
     */
    public function findByIdWithRelations(int $id): Survey
    {
        return Survey::with('questions.options')->findOrFail($id);
    }

    /**
     * Tạo bản sao survey mới trong database
     * 
     * @param array $data Dữ liệu survey cần tạo
     * @return Survey Survey đã được tạo
     */
    public function createDuplicate(array $data): Survey
    {
        return Survey::create($data);
    }
}