<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        /**
         * Thứ tự tạo bảng (KHÔNG tạo users ở file này):
         * 1) Faculties, Statuses, Classes
         * 2) Permissions
         * 3) UserPermissions (ref Users, Permissions, Users)
         * 4) RoleDefaultPermissions (ref Permissions)
         * 5) Groups (ref Users)
         * 6) GroupMembers (ref Groups, Users)
         * 7) Posts (ref Users, Groups, Posts self)
         * 8) PostLikes (ref Posts, Users)
         * 9) PostShares (ref Posts, Users)
         * 10) Categories (SMALLINT)
         * 11) Surveys (ref Categories, Users)
         * 12) SurveyQuestions (ref Surveys)
         * 13) SurveyOptions (ref SurveyQuestions)
         * 14) SurveyAnswers (ref SurveyQuestions, Users, SurveyOptions)
         * 15) GroupPosts (ref Groups, Users, Posts)
         * 16) Follows (ref Users)
         * 17) Events (ref Users)
         * 18) Deadlines (ref Users)
         * 19) Badges
         * 20) UserBadges (ref Users, Badges, Users)
         *
         * Ghi chú: File mặc định 0001_01_01_000000_create_users_table.php sẽ tạo bảng users trước.
         * Bạn đã có migration add_profile_fields_to_users_table để bổ sung cột + FK cho users chạy SAU file này.
         */

        // 1) Faculties
        Schema::create('faculties', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('code', 2)->unique(); 
            $table->string('name', 100)->unique();
            $table->string('code', 2)->unique();
            $table->text('description')->nullable();
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
            $table->softDeletes();
        });

        // 1) Statuses
        Schema::create('statuses', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->enum('name', ['active', 'banned'])->default('active');
            $table->text('reason')->nullable();
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
            $table->softDeletes();
        });

        // 1) Classes
        Schema::create('classes', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('name', 100);
            $table->text('description')->nullable();
            $table->foreignId('faculty_id')->nullable()
                ->constrained('faculties')->cascadeOnUpdate()->nullOnDelete();
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
            $table->softDeletes();
        });

        // 2) Permissions
        Schema::create('permissions', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('name', 100)->unique();
            $table->text('description')->nullable();
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
            $table->softDeletes();
        });

        // 3) UserPermissions
        Schema::create('user_permissions', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignId('user_id')->nullable()
                ->constrained('users')->cascadeOnUpdate()->cascadeOnDelete();
            $table->foreignId('permission_id')->nullable()
                ->constrained('permissions')->cascadeOnUpdate()->cascadeOnDelete();
            $table->timestamp('granted_at')->nullable();
            $table->foreignId('granted_by')->nullable()
                ->constrained('users')->cascadeOnUpdate()->nullOnDelete();
        });

        // 4) RoleDefaultPermissions
        Schema::create('role_default_permissions', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->enum('role', ['student', 'lecturer', 'admin']);
            $table->foreignId('permission_id')->nullable()
                ->constrained('permissions')->cascadeOnUpdate()->nullOnDelete();
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
            $table->softDeletes();
        });

        // 5) Groups
        Schema::create('groups', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('name', 255);
            $table->text('description')->nullable();
            $table->foreignId('created_by')->nullable()
                ->constrained('users')->cascadeOnUpdate()->nullOnDelete();
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
            $table->softDeletes();
        });

        // 6) GroupMembers
        Schema::create('group_members', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignId('group_id')->constrained('groups')->cascadeOnUpdate()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnUpdate()->cascadeOnDelete();
            $table->enum('role', ['member', 'moderator', 'lecturer', 'admin'])->default('member');
            $table->timestamp('joined_at')->nullable();
            $table->softDeletes();
            $table->unique(['group_id', 'user_id']);
        });

        // 7) Posts
        Schema::create('posts', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignId('user_id')->constrained('users')->cascadeOnUpdate()->cascadeOnDelete();
            $table->foreignId('group_id')->nullable()
                ->constrained('groups')->cascadeOnUpdate()->nullOnDelete();
            $table->foreignId('parent_id')->nullable()
                ->constrained('posts')->cascadeOnUpdate()->nullOnDelete();
            $table->enum('type', ['announcement', 'group_post', 'comment','normal_post'])->default('announcement');
            $table->text('content')->nullable();
            $table->string('media_url', 255)->nullable();
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
            $table->softDeletes();
        });

        // 8) PostLikes
        Schema::create('post_likes', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignId('post_id')->constrained('posts')->cascadeOnUpdate()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnUpdate()->cascadeOnDelete();
            $table->timestamp('created_at')->nullable();
            $table->unique(['post_id', 'user_id']);
        });

        // 9) PostShares
        Schema::create('post_shares', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignId('post_id')->constrained('posts')->cascadeOnUpdate()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnUpdate()->cascadeOnDelete();
            $table->timestamp('created_at')->nullable();
            $table->softDeletes();
            $table->index(['post_id', 'user_id']);
        });

        // 10) Categories (SMALLINT PK theo DBML)
        Schema::create('categories', function (Blueprint $table) {
            $table->unsignedSmallInteger('id')->primary();
            $table->string('name', 255)->nullable();
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
            $table->softDeletes();
        });

        // 11) Surveys
        Schema::create('surveys', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('title', 255);
            $table->text('description')->nullable();

            $table->unsignedSmallInteger('categories_id');
            $table->foreign('categories_id')
                ->references('id')->on('categories')
                ->cascadeOnUpdate()->restrictOnDelete();

            $table->enum('type', ['survey', 'quiz'])->default('survey');
            $table->timestamp('start_at')->nullable();
            $table->timestamp('end_at')->nullable();
            $table->integer('time_limit')->nullable();
            $table->integer('points')->default(0);
            $table->enum('object', ['public', 'students', 'lecturers'])->default('public');

            // THÊM MỚI: trạng thái survey/quiz + cho xem lại hay không
            $table->enum('status', ['pending', 'active', 'paused', 'closed'])->default('pending');
            $table->boolean('allow_review')->default(false);

            $table->foreignId('created_by')->constrained('users')->cascadeOnUpdate()->cascadeOnDelete();
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
            $table->softDeletes();
        });

        // 12) SurveyQuestions (MỞ RỘNG)
        Schema::create('survey_questions', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignId('survey_id')->constrained('surveys')->cascadeOnUpdate()->cascadeOnDelete();

            // Mã câu hỏi (Q001, Q002,...)
            $table->string('question_code', 50)->nullable();

            $table->text('question_text');

            // Ảnh câu hỏi
            $table->text('image')->nullable();

            // ĐỔI: từ enum cũ sang string linh hoạt cho 15 loại
            $table->string('question_type', 50);

            // bắt buộc: none / soft / hard
            $table->enum('required', ['none', 'soft', 'hard'])->default('none');

            // điều kiện logic (ẩn/hiện theo câu trước)
            $table->json('conditions')->nullable();

            // kịch bản mặc định (nếu dùng)
            $table->unsignedInteger('default_scenario')->nullable();

            // giới hạn độ dài cho text/number
            $table->unsignedInteger('max_length')->nullable();

            // chỉ cho phép số
            $table->boolean('numeric_only')->default(false);

            // cho file upload: số lượng file tối đa
            $table->unsignedInteger('max_questions')->nullable();

            // loại file cho phép, ví dụ: "jpg,png,pdf"
            $table->string('allowed_file_types', 255)->nullable();

            // kích thước tối đa mỗi file (KB)
            $table->unsignedInteger('max_file_size_kb')->nullable();

            // text trợ giúp dưới câu hỏi
            $table->text('help_text')->nullable();

            // điểm tối đa của câu
            $table->integer('points')->default(0);
        });

        // 13) SurveyOptions (MỞ RỘNG)
        Schema::create('survey_options', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignId('question_id')->constrained('survey_questions')->cascadeOnUpdate()->cascadeOnDelete();
            $table->string('option_text', 255);

            // Ảnh của option (cho câu chọn hình)
            $table->text('image')->nullable();

            // cho ma trận: option này là subquestion hay không
            $table->boolean('is_subquestion')->default(false);

            // thứ tự hiển thị
            $table->unsignedInteger('position')->nullable();

            $table->boolean('is_correct')->default(false);

            $table->index(['question_id', 'position']);
        });

        // 14) SurveyAnswers (MỞ RỘNG)
        Schema::create('survey_answers', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignId('question_id')->constrained('survey_questions')->cascadeOnUpdate()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnUpdate()->cascadeOnDelete();
            $table->foreignId('selected_option_id')->nullable()
                ->constrained('survey_options')->cascadeOnUpdate()->nullOnDelete();
            $table->text('answer_text')->nullable();

            // text comment cho "Danh sách có nhận xét"
            $table->text('comment_text')->nullable();

            // lưu ma trận (JSON)
            $table->json('matrix_answer')->nullable();

            // fallback: nếu muốn lưu trực tiếp list URL file
            $table->json('file_urls')->nullable();

            $table->timestamp('answered_at')->nullable();
            $table->integer('score')->default(0);
            $table->softDeletes();
        });

        // BẢNG MỚI:  Pivot lưu nhiều option cho 1 answer (multiple choice)
        Schema::create('survey_answer_options', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignId('answer_id')->constrained('survey_answers')->cascadeOnUpdate()->cascadeOnDelete();
            $table->foreignId('option_id')->constrained('survey_options')->cascadeOnUpdate()->cascadeOnDelete();
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
            $table->unique(['answer_id', 'option_id']);
        });

        // BẢNG MỚI: lưu file upload cho câu trả lời
        Schema::create('survey_answer_files', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignId('answer_id')->constrained('survey_answers')->cascadeOnUpdate()->cascadeOnDelete();
            $table->string('file_path', 255);
            $table->string('original_name', 255)->nullable();
            $table->unsignedInteger('file_size_kb')->nullable();
            $table->string('mime_type', 100)->nullable();
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
        });

        // BẢNG MỚI: tổng kết điểm quiz cho mỗi user
        Schema::create('survey_results', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignId('survey_id')->constrained('surveys')->cascadeOnUpdate()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnUpdate()->cascadeOnDelete();

            $table->integer('total_score')->default(0);
            $table->integer('max_score')->default(0);
            $table->enum('status', ['in_progress', 'completed'])->default('completed');

            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();

            $table->unique(['survey_id', 'user_id']);
        });

        // 15) GroupPosts
        Schema::create('group_posts', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignId('group_id')->constrained('groups')->cascadeOnUpdate()->cascadeOnDelete();
            $table->foreignId('sender_id')->constrained('users')->cascadeOnUpdate()->cascadeOnDelete();
            $table->foreignId('post_id')->constrained('posts')->cascadeOnUpdate()->cascadeOnDelete();
            $table->timestamp('sent_at')->nullable();
            $table->softDeletes();
            $table->unique(['group_id', 'post_id']);
        });

        // 16) Follows
        Schema::create('follows', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignId('follower_id')->constrained('users')->cascadeOnUpdate()->cascadeOnDelete();
            $table->foreignId('followed_id')->constrained('users')->cascadeOnUpdate()->cascadeOnDelete();
            $table->enum('status', ['active', 'blocked'])->default('active');
            $table->timestamp('created_at')->nullable();
            $table->unique(['follower_id', 'followed_id']);
        });

        // 17) Events
        Schema::create('events', function (Blueprint $table) {
            $table->increments('id'); // int auto-increment
            $table->text('title');
            $table->datetime('event_date');
            $table->text('location')->nullable();
            $table->timestamp('created_at')->nullable();
            $table->foreignId('created_by')->constrained('users')->cascadeOnUpdate()->cascadeOnDelete();
            $table->softDeletes();
        });

        // 18) Deadlines
        Schema::create('deadlines', function (Blueprint $table) {
            $table->increments('id'); // int auto-increment
            $table->text('title');
            $table->date('deadline_date');
            $table->text('details')->nullable();
            $table->timestamp('created_at')->nullable();
            $table->foreignId('created_by')->constrained('users')->cascadeOnUpdate()->cascadeOnDelete();
            $table->softDeletes();
        });

        // 19) Badges
        Schema::create('badges', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('name', 255)->unique();
            $table->text('description')->nullable();
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
            $table->softDeletes();
        });

        // 20) UserBadges
        Schema::create('user_badges', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignId('user_id')->constrained('users')->cascadeOnUpdate()->cascadeOnDelete();
            $table->foreignId('badge_id')->constrained('badges')->cascadeOnUpdate()->cascadeOnDelete();
            $table->foreignId('assigned_by')->nullable()
                ->constrained('users')->cascadeOnUpdate()->nullOnDelete();
            $table->timestamp('assigned_at')->useCurrent();
            $table->timestamp('revoked_at')->nullable();
        });
         // 21) PostImages
        Schema::create('post_media', function (Blueprint $table) {
            $table->id();
            $table->foreignId('post_id')->constrained()->onDelete('cascade');
            $table->string('url');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        // Bảng mới (phải drop trước vì FK)
        Schema::dropIfExists('survey_results');
        Schema::dropIfExists('survey_answer_files');
        Schema::dropIfExists('survey_answer_options');
        Schema::dropIfExists('post_media');
        Schema::dropIfExists('user_badges');
        Schema::dropIfExists('badges');
        Schema::dropIfExists('deadlines');
        Schema::dropIfExists('events');
        Schema::dropIfExists('follows');
        Schema::dropIfExists('group_posts');
        Schema::dropIfExists('survey_answers');
        Schema::dropIfExists('survey_options');
        Schema::dropIfExists('survey_questions');
        Schema::dropIfExists('surveys');
        Schema::dropIfExists('post_shares');
        Schema::dropIfExists('post_likes');
        Schema::dropIfExists('posts');
        Schema::dropIfExists('group_members');
        Schema::dropIfExists('groups');
        Schema::dropIfExists('role_default_permissions');
        Schema::dropIfExists('user_permissions');
        Schema::dropIfExists('permissions');
        Schema::dropIfExists('categories');
        Schema::dropIfExists('classes');
        Schema::dropIfExists('statuses');
        Schema::dropIfExists('faculties');
    }
};
