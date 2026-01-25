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
            $table->double('priorities_identification_score')->change();
            $table->double('priorities_root_problem_score')->change();
            $table->double('priorities_fixing_activity_score')->change();
            $table->double('priorities_implementation_activity_score')->change();
            $table->double('priorities_score')->change();

            $table->double('aggregates_identification_score')->change();
            $table->double('aggregates_root_problem_score')->change();
            $table->double('aggregates_fixing_activity_score')->change();
            $table->double('aggregates_implementation_activity_score')->change();
            $table->double('aggregates_score')->change();
        });

        Schema::table('reports', function (Blueprint $table) {
            $table->double('priorities_score')->change();
            $table->double('aggregates_score')->change();
            $table->double('arkas_score')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('rkts', function (Blueprint $table) {
            $table->integer('priorities_identification_score')->change();
            $table->integer('priorities_root_problem_score')->change();
            $table->integer('priorities_fixing_activity_score')->change();
            $table->integer('priorities_implementation_activity_score')->change();
            $table->integer('priorities_score')->change();

            $table->integer('aggregates_identification_score')->change();
            $table->integer('aggregates_root_problem_score')->change();
            $table->integer('aggregates_fixing_activity_score')->change();
            $table->integer('aggregates_implementation_activity_score')->change();
            $table->integer('aggregates_score')->change();
        });

        Schema::table('reports', function (Blueprint $table) {
            $table->integer('priorities_score')->change();
            $table->integer('aggregates_score')->change();
            $table->integer('arkas_score')->change();
        });
    }
};
