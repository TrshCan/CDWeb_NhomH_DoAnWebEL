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
        Schema::table('surveys', function (Blueprint $table) {
            // Thêm các field cho Welcome screen
            $table->string('welcome_title', 500)->nullable()->after('description');
            $table->text('welcome_description')->nullable()->after('welcome_title');
            
            // Thêm các field cho End screen
            $table->string('end_title', 500)->nullable()->after('welcome_description');
            $table->text('end_description')->nullable()->after('end_title');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('surveys', function (Blueprint $table) {
            $table->dropColumn(['welcome_title', 'welcome_description', 'end_title', 'end_description']);
        });
    }
};
