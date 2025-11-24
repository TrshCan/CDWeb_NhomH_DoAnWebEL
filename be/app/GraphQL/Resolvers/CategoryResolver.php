<?php

namespace App\GraphQL\Resolvers;

use App\Services\CategoryService;
use Illuminate\Validation\ValidationException;

/**
 * Class CategoryResolver
 *
 * Resolver chịu trách nhiệm nhận các truy vấn (query, mutation)
 * từ phía GraphQL và gọi tầng Service để xử lý nghiệp vụ.
 *
 * Luồng hoạt động:
 * - Client gửi request GraphQL (query hoặc mutation)
 * - Resolver nhận arguments từ GraphQL
 * - Gọi các hàm tương ứng trong CategoryService
 * - Trả về kết quả cho client
 */
class CategoryResolver
{
    /**
     * Inject CategoryService vào Resolver để sử dụng logic nghiệp vụ.
     */
    public function __construct(private CategoryService $service) {}

    /**
     * Query: Lấy danh sách tất cả categories.
     * 
     * GraphQL ví dụ:
     * ```graphql
     * query {
     *   categories {
     *     id
     *     name
     *     created_at
     *   }
     * }
     * ```
     *
     * @param  mixed $_    (Tham số root, không dùng trong trường hợp này)
     * @param  array $args (Các tham số truyền từ query, nếu có)
     * @return \Illuminate\Support\Collection Danh sách category
     */
    public function list($_, array $args)
    {
        // Gọi service để lấy danh sách category
        return $this->service->list();
    }

    /**
     * Mutation: Tạo mới một category.
     *
     * GraphQL ví dụ:
     * ```graphql
     * mutation {
     *   createCategory(input: { id: 10, name: "Tin tức" }) {
     *     id
     *     name
     *   }
     * }
     * ```
     *
     * @param  mixed $_
     * @param  array $args  Mảng chứa input (ví dụ: ['input' => ['id' => 1, 'name' => 'Tin tức']])
     * @return \App\Models\Category
     * @throws ValidationException Nếu dữ liệu không hợp lệ hoặc trùng name/id
     */
    public function create($_, array $args)
    {
        // args['input'] chứa dữ liệu GraphQL input
        return $this->service->create($args['input']);
    }

    /**
     * Mutation: Cập nhật category theo ID.
     *
     * GraphQL ví dụ:
     * ```graphql
     * mutation {
     *   updateCategory(id: 10, input: { name: "Thông báo" }) {
     *     id
     *     name
     *   }
     * }
     * ```
     *
     * @param  mixed $_
     * @param  array $args  ['id' => 10, 'input' => ['name' => 'Thông báo']]
     * @return \App\Models\Category
     * @throws ValidationException Nếu dữ liệu sai hoặc trùng name
     */
    public function update($_, array $args)
    {
        // Gọi service update với id và input
        return $this->service->update($args['id'], $args['input']);
    }

    /**
     * Mutation: Xóa category (soft delete).
     *
     * GraphQL ví dụ:
     * ```graphql
     * mutation {
     *   deleteCategory(id: 10, allowIfReferenced: false)
     * }
     * ```
     *
     * @param  mixed $_
     * @param  array $args  ['id' => 10, 'allowIfReferenced' => false]
     * @return bool  True nếu xóa thành công
     * @throws ValidationException Nếu đang bị tham chiếu bởi surveys
     */
    public function delete($_, array $args): bool
    {
        // Nếu GraphQL không truyền allowIfReferenced, mặc định là false
        $allow = $args['allowIfReferenced'] ?? false;

        // Gọi service để xóa category (soft delete)
        return $this->service->delete($args['id'], $allow);
    }
}
