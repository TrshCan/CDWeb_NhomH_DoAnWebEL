<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Migration gộp các thay đổi:
     * - Add welcome/end fields to surveys
     * - Create question_groups table
     * - Add group_id to survey_questions
     * - Make option_text nullable
     * - Create survey_shares table
     */
    public function up(): void
    {
        // 1. Add welcome/end fields to surveys table
        Schema::table('surveys', function (Blueprint $table) {
            if (!Schema::hasColumn('surveys', 'welcome_title')) {
                $table->string('welcome_title', 500)->nullable()->after('description');
                $table->text('welcome_description')->nullable()->after('welcome_title');
                $table->string('end_title', 500)->nullable()->after('welcome_description');
                $table->text('end_description')->nullable()->after('end_title');
            }
        });

        // 2. Create question_groups table
        if (!Schema::hasTable('question_groups')) {
            Schema::create('question_groups', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('survey_id');
                $table->string('title')->default('Nhóm câu hỏi');
                $table->integer('position')->default(1);
                $table->timestamps();
                
                $table->foreign('survey_id')->references('id')->on('surveys')->onDelete('cascade');
                $table->index(['survey_id', 'position']);
            });
        }

        // 3. Add group_id and position to survey_questions
        Schema::table('survey_questions', function (Blueprint $table) {
            if (!Schema::hasColumn('survey_questions', 'group_id')) {
                $table->unsignedBigInteger('group_id')->nullable()->after('survey_id');
                $table->integer('position')->default(1)->after('group_id');
                
                $table->foreign('group_id')
                    ->references('id')
                    ->on('question_groups')
                    ->onDelete('cascade');
                
                $table->index(['group_id', 'position']);
            }
        });

        // 4. Make option_text nullable in survey_options
        Schema::table('survey_options', function (Blueprint $table) {
            $table->string('option_text', 255)->nullable()->change();
        });

        // 5. Create survey_shares table
        if (!Schema::hasTable('survey_shares')) {
            Schema::create('survey_shares', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->foreignId('survey_id')->constrained('surveys')->cascadeOnUpdate()->cascadeOnDelete();
                
                $table->enum('share_type', ['public', 'email', 'group'])->default('public');
                $table->string('share_token', 100)->unique()->nullable();
                $table->string('email', 255)->nullable();
                $table->foreignId('group_id')->nullable()->constrained('groups')->cascadeOnUpdate()->nullOnDelete();
                $table->enum('status', ['pending', 'completed'])->default('pending');
                
                $table->timestamp('sent_at')->nullable();
                $table->timestamp('completed_at')->nullable();
                $table->foreignId('created_by')->nullable()->constrained('users')->cascadeOnUpdate()->nullOnDelete();
                
                $table->timestamps();
                $table->softDeletes();
                
                $table->index(['survey_id', 'share_type']);
                $table->index(['survey_id', 'email']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop in reverse order
        Schema::dropIfExists('survey_shares');
        
        Schema::table('survey_options', function (Blueprint $table) {
            $table->string('option_text', 255)->nullable(false)->change();
        });
        
        Schema::table('survey_questions', function (Blueprint $table) {
            if (Schema::hasColumn('survey_questions', 'group_id')) {
                $table->dropForeign(['group_id']);
                $table->dropIndex(['group_id', 'position']);
                $table->dropColumn(['group_id', 'position']);
            }
        });
        
        Schema::dropIfExists('question_groups');
        
        Schema::table('surveys', function (Blueprint $table) {
            if (Schema::hasColumn('surveys', 'welcome_title')) {
                $table->dropColumn(['welcome_title', 'welcome_description', 'end_title', 'end_description']);
            }
        });
    }
};
