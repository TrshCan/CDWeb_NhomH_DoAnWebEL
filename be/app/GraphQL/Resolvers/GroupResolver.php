<?php

namespace App\GraphQL\Resolvers;

use App\Services\GroupService;

class GroupResolver
{
    protected $groupService;
    
    public function __construct(GroupService $groupService)
    {
        $this->groupService = $groupService;
    }
    
    /**
     * Lấy thông tin group
     */
    public function find($rootValue, array $args)
    {
        return $this->groupService->getGroupById($args['id']);
    }
    
    /**
     * Tạo group mới
     */
    public function create($rootValue, array $args)
    {
        return $this->groupService->createGroup($args['input']);
    }
    
    /**
     * Cập nhật group
     */
    public function update($rootValue, array $args)
    {
        return $this->groupService->updateGroup($args['id'], $args['input']);
    }
    
    /**
     * Xóa group
     */
    public function delete($rootValue, array $args)
    {
        return $this->groupService->deleteGroup($args['id']);
    }
    
    /**
     * Sao chép group
     */
    public function duplicate($rootValue, array $args)
    {
        return $this->groupService->duplicateGroup($args['id']);
    }
}
