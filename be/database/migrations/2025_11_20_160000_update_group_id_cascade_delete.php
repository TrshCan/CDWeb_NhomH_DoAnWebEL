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
            // Xóa foreign key cũ
            $table->dropForeign(['group_id']);
            
            // Thêm lại với cascade delete
            $table->foreign('group_id')
                ->references('id')
                ->on('question_groups')
                ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('survey_questions', function (Blueprint $table) {
            // Xóa foreign key mới
            $table->dropForeign(['group_id']);
            
            // Thêm lại foreign key cũ với set null
            $table->foreign('group_id')
                ->references('id')
                ->on('question_groups')
                ->onDelete('set null');
        });
    }
};
