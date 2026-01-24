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
            $table->boolean('is_require_cost')->default(false)->after('implementation_activity');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('rkts', function (Blueprint $table) {
            $table->dropColumn('is_require_cost');
        });
    }
};
