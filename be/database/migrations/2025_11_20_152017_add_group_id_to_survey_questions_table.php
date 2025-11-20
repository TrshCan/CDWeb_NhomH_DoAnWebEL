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
            $table->unsignedBigInteger('group_id')->nullable()->after('survey_id');
            $table->integer('position')->default(1)->after('group_id');
            
            // Foreign key
            $table->foreign('group_id')->references('id')->on('question_groups')->onDelete('set null');
            
            // Index
            $table->index(['group_id', 'position']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('survey_questions', function (Blueprint $table) {
            $table->dropForeign(['group_id']);
            $table->dropIndex(['group_id', 'position']);
            $table->dropColumn(['group_id', 'position']);
        });
    }
};
