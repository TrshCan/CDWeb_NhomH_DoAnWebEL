<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Mở rộng thông tin
            $table->string('phone', 255)->nullable()->after('email');
            $table->unique('phone');
            $table->string('address', 255)->nullable()->after('phone');
            $table->string('avatar', 255)->nullable()->default('default.png')->after('address');
            $table->enum('role', ['student','lecturer','admin'])->default('student')->after('address');

            // FK (các bảng đích phải tồn tại trước)
            $table->foreignId('class_id')->nullable()->after('role')
                ->constrained('classes')->cascadeOnUpdate()->nullOnDelete();

            $table->foreignId('faculty_id')->nullable()->after('class_id')
                ->constrained('faculties')->cascadeOnUpdate()->nullOnDelete();

            $table->foreignId('status_id')->after('faculty_id')
                ->constrained('statuses')->cascadeOnUpdate()->restrictOnDelete();

            // Lý do cấm & điểm
            $table->text('ban_reason')->nullable()->after('status_id');
            $table->integer('point')->default(0)->after('ban_reason');

            // Soft deletes
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Drop FK trước
            $table->dropForeign(['class_id']);
            $table->dropForeign(['faculty_id']);
            $table->dropForeign(['status_id']);

            // Xoá các cột đã thêm
            $table->dropColumn([
                'phone','address','role','class_id','faculty_id',
                'status_id','ban_reason','point','deleted_at'
            ]);
        });
    }
};
