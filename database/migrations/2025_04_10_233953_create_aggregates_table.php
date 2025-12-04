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
        Schema::create('aggregates', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('report_id');
            $table->jsonb('identifications');
            $table->jsonb('root_problems');
            $table->jsonb('fixing_activities');
            $table->jsonb('implementation_activities');
            $table->timestamps();

            $table->foreign('report_id')->references('id')->on('reports')->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('aggregates');
    }
};
