<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('survey_questions', function (Blueprint $table) {
            // Cập nhật question_code: không null, tối đa 100 ký tự, unique trong cùng survey
            $table->string('question_code', 100)->nullable(false)->change();
            
            // Thêm unique constraint cho (survey_id, question_code)
            $table->unique(['survey_id', 'question_code'], 'unique_question_code_per_survey');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('survey_questions', function (Blueprint $table) {
            // Xóa unique constraint
            $table->dropUnique('unique_question_code_per_survey');
            
            // Đặt lại question_code về nullable
            $table->string('question_code', 50)->nullable()->change();
        });
    }
};
