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
        Schema::table('reports', function (Blueprint $table) {
            $table->decimal('priorities_school_independent_program_score', 5, 2)->default(0);
            $table->decimal('aggregates_school_independent_program_score', 5, 2)->default(0);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('reports', function (Blueprint $table) {
            $table->dropColumn('priorities_school_independent_program_score');
            $table->dropColumn('aggregates_school_independent_program_score');
        });
    }
};
