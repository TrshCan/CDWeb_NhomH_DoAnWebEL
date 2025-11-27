<?php

namespace App\Services;

use App\Repositories\CategoryRepository;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;
use App\Models\Category;
use Illuminate\Database\QueryException;

class CategoryService
{
    /**
     * Khởi tạo Service, inject Repository (Dependency Injection)
     * Repository sẽ chịu trách nhiệm truy xuất DB cho model Category.
     */
    public function __construct(private CategoryRepository $repo) {}

    /**
     * Lấy danh sách tất cả Category (chưa bị soft delete)
     * 
     * @return \Illuminate\Support\Collection Danh sách các Category
     */
    public function list(): \Illuminate\Support\Collection
    {
        // Gọi repository để lấy toàn bộ bản ghi
        return $this->repo->all();
    }

    /**
     * Tạo mới một Category.
     * - Validate dữ liệu đầu vào.
     * - Kiểm tra trùng name.
     * - Gọi repository để insert DB.
     * 
     * @param  array $input Dữ liệu đầu vào (id, name)
     * @return \App\Models\Category
     * @throws ValidationException Nếu dữ liệu không hợp lệ hoặc trùng ID/name
     */
    public function create(array $input): Category
    {
        // Bước 1: Kiểm tra hợp lệ dữ liệu đầu vào
        $v = Validator::make($input, [
            'id'   => ['nullable', 'integer', 'min:1', 'max:32767'], // ID có thể không truyền, sẽ tự động tính
            'name' => ['required', 'string', 'min:2', 'max:255'], // name bắt buộc, tối thiểu 2 ký tự, tối đa 255 ký tự
        ], [
            'name.required' => 'Tên danh mục không được để trống.',
            'name.min' => 'Tên danh mục phải có ít nhất 2 ký tự.',
            'name.max' => 'Tên danh mục không được vượt quá 255 ký tự.',
        ]);

        // Nếu dữ liệu sai → ném lỗi ValidationException
        if ($v->fails()) {
            throw new ValidationException($v);
        }

        // Bước 2: Kiểm tra trùng name
        if ($this->repo->existsByName($input['name'])) {
            throw ValidationException::withMessages([
                'name' => 'Tên danh mục này đã tồn tại.',
            ]);
        }

        // Bước 3: Tự động tính ID nếu không được truyền hoặc ID đã tồn tại
        if (empty($input['id'])) {
            $input['id'] = $this->repo->getNextId();
        }

        // Bước 4: Gọi repository để thêm vào DB
        try {
            return $this->repo->create($input);
        } catch (QueryException $e) {
            // Trường hợp lỗi DB (VD: trùng ID) - thử lại với ID mới
            $input['id'] = $this->repo->getNextId();
            return $this->repo->create($input);
        }
    }

    /**
     * Cập nhật Category theo ID.
     * - Validate name (nếu có).
     * - Kiểm tra trùng name.
     * - Gọi repository để update DB.
     * 
     * @param  int   $id     ID của Category cần cập nhật
     * @param  array $input  Dữ liệu cập nhật (chỉ name)
     * @return \App\Models\Category
     * @throws ValidationException Nếu dữ liệu sai hoặc trùng name
     */
    public function update(int $id, array $input): Category
    {
        // Bước 1: Kiểm tra hợp lệ dữ liệu
        $v = Validator::make($input, [
            'name' => ['nullable', 'string', 'max:255'],
        ]);
        if ($v->fails()) {
            throw new ValidationException($v);
        }

        // Bước 2: Nếu có name mới, kiểm tra xem có trùng với Category khác không
        if (array_key_exists('name', $input) && $input['name'] !== null) {
            if ($this->repo->existsByName($input['name'], $id)) {
                throw ValidationException::withMessages([
                    'name' => 'Category name đã tồn tại.',
                ]);
            }
        }

        // Bước 3: Cập nhật DB thông qua Repository
        return $this->repo->update($id, $input);
    }

    /**
     * Xóa Category (soft delete)
     * - Kiểm tra nếu Category đang được sử dụng bởi bảng Surveys thì không cho xóa.
     * - Có thể ép xóa nếu cho phép (`allowIfReferenced = true`).
     * 
     * @param  int  $id                  ID Category cần xóa
     * @param  bool $allowIfReferenced   Cho phép xóa dù đang được sử dụng hay không
     * @return bool                      True nếu xóa thành công
     * @throws ValidationException       Nếu category đang được tham chiếu mà không được phép xóa
     */
    public function delete(int $id, bool $allowIfReferenced = false): bool
    {
        // Bước 1: Kiểm tra nếu category đang được sử dụng trong bảng surveys
        if (!$allowIfReferenced && $this->repo->referencedBySurveys($id)) {
            throw ValidationException::withMessages([
                'id' => 'Không thể xóa: Category đang được sử dụng bởi surveys.',
            ]);
        }

        // Bước 2: Thực hiện soft delete (Eloquent sẽ gán deleted_at)
        return $this->repo->delete($id);
    }
}