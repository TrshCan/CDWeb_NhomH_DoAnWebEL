<?php

namespace App\Repositories;
use App\Models\Category;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class CategoryRepository
{
    /**
     * Lấy toàn bộ danh sách Category trong CSDL
     * 
     * @return \Illuminate\Database\Eloquent\Collection Danh sách các bản ghi Category (không bao gồm soft delete)
     */
    public function all(): Collection
    {
        // Truy vấn tất cả Category và sắp xếp theo ID
        return Category::query()->orderBy('id')->get();
    }

    /**
     * Tìm một Category theo ID, nếu không có sẽ ném ModelNotFoundException.
     * 
     * @param  int  $id  ID Category cần tìm
     * @return \App\Models\Category
     */
    public function findOrFail(int $id): Category
    {
        // findOrFail() sẽ tự ném lỗi nếu không tìm thấy
        return Category::query()->findOrFail($id);
    }

    /**
     * Tạo mới một Category trong cơ sở dữ liệu.
     * 
     * @param  array  $data  Mảng dữ liệu gồm 'id' và 'name'
     * @return \App\Models\Category
     */
    public function create(array $data): Category
    {
        // Vì cột ID là SMALLINT (không auto-increment), bắt buộc phải truyền ID vào
        return Category::create([
            'id'   => $data['id'],
            'name' => $data['name'] ?? null,
        ]);
    }

    /**
     * Cập nhật thông tin Category (chủ yếu là 'name')
     * 
     * @param  int    $id    ID Category cần cập nhật
     * @param  array  $data  Dữ liệu cập nhật (ví dụ ['name' => 'Tên mới'])
     * @return \App\Models\Category
     */
    public function update(int $id, array $data): Category
    {
        // Tìm bản ghi theo ID
        $cat = $this->findOrFail($id);

        // Nếu mảng có key 'name' thì cập nhật
        if (array_key_exists('name', $data)) {
            $cat->name = $data['name'];
        }

        // Lưu thay đổi vào DB
        $cat->save();

        return $cat;
    }

    /**
     * Xóa Category (soft delete)
     * 
     * @param  int  $id  ID Category cần xóa
     * @return bool  True nếu xóa thành công
     */
    public function delete(int $id): bool
    {
        // Tìm Category cần xóa
        $cat = $this->findOrFail($id);

        // Soft delete: Eloquent sẽ gán giá trị cho deleted_at
        return (bool) $cat->delete();
    }

    /**
     * Xóa vĩnh viễn Category (bỏ qua soft delete)
     * 
     * @param  int  $id  ID Category cần xóa vĩnh viễn
     * @return bool  True nếu xóa thành công
     */
    public function forceDelete(int $id): bool
    {
        // Xóa khỏi DB (hard delete)
        $cat = $this->findOrFail($id);
        return (bool) $cat->forceDelete();
    }

    /**
     * Kiểm tra xem có tồn tại Category với name trùng hay không.
     * Dùng để đảm bảo tính unique của name trước khi tạo/sửa.
     * 
     * @param  string     $name       Tên cần kiểm tra
     * @param  int|null   $ignoreId   Bỏ qua kiểm tra đối với ID cụ thể (khi update)
     * @return bool                   True nếu name đã tồn tại
     */
    public function existsByName(string $name, ?int $ignoreId = null): bool
    {
        // Tạo query cơ bản kiểm tra name
        $q = Category::query()->where('name', $name);

        // Nếu đang update, bỏ qua chính bản ghi đó
        if ($ignoreId !== null) {
            $q->where('id', '!=', $ignoreId);
        }

        // exists() trả về true nếu tìm thấy ít nhất 1 bản ghi
        return $q->exists();
    }

    /**
     * Kiểm tra xem Category có đang được sử dụng trong bảng surveys hay không.
     * Dùng trước khi xóa để tránh xóa Category đang được tham chiếu.
     * 
     * @param  int  $id  ID Category cần kiểm tra
     * @return bool      True nếu Category đang được sử dụng trong surveys
     */
    public function referencedBySurveys(int $id): bool
    {
        // Kiểm tra bảng surveys, nếu có categories_id khớp => đang được sử dụng
        return DB::table('surveys')->where('categories_id', $id)->exists();
    }

    /**
     * Lấy ID tiếp theo cho Category mới.
     * Tính toán dựa trên max ID hiện có (bao gồm cả soft deleted).
     * 
     * @return int ID tiếp theo
     */
    public function getNextId(): int
    {
        // Lấy max ID từ tất cả categories (bao gồm cả soft deleted)
        $maxId = Category::withTrashed()->max('id');
        return ($maxId ?? 0) + 1;
    }
}