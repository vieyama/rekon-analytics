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
            $table->longText('implementation_activity_recommendation')->nullable()->after('fixing_activity_recommendation');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('rkts', function (Blueprint $table) {
            $table->dropColumn('implementation_activity_recommendation');
        });
    }
};
