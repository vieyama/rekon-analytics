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
        Schema::table('rkts', function (Blueprint $table) {
            $table->text('fixing_activity_recommendation')->nullable()->after('fixing_activity');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('rkts', function (Blueprint $table) {
            $table->dropColumn('fixing_activity_recommendation');
        });
    }
};
