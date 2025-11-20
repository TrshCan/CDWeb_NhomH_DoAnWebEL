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
        Schema::create('question_groups', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('survey_id');
            $table->string('title')->default('Nhóm câu hỏi');
            $table->integer('position')->default(1);
            $table->timestamps();
            
            // Foreign key
            $table->foreign('survey_id')->references('id')->on('surveys')->onDelete('cascade');
            
            // Index
            $table->index(['survey_id', 'position']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('question_groups');
    }
};
