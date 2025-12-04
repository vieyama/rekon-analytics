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
        Schema::create('rkts', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('report_id');
            $table->string('identification');
            $table->string('root_problem');
            $table->string('fixing_activity');
            $table->jsonb('implementation_activity');

            $table->integer('priorities_identification_score');
            $table->integer('priorities_root_problem_score');
            $table->integer('priorities_fixing_activity_score');
            $table->integer('priorities_implementation_activity_score');
            $table->integer('priorities_score');

            $table->integer('aggregates_identification_score');
            $table->integer('aggregates_root_problem_score');
            $table->integer('aggregates_fixing_activity_score');
            $table->integer('aggregates_implementation_activity_score');
            $table->integer('aggregates_score');
            $table->timestamps();

            $table->foreign('report_id')->references('id')->on('reports')->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('rkts');
    }
};
