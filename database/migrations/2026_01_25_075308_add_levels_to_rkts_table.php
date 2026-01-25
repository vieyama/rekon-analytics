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
            $table->string('priorities_activity_level')->nullable()->after('priorities_fixing_activity_score');
            $table->string('priorities_implementation_level')->nullable()->after('priorities_implementation_activity_score');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('rkts', function (Blueprint $table) {
            $table->dropColumn(['priorities_activity_level', 'priorities_implementation_level']);
        });
    }
};
