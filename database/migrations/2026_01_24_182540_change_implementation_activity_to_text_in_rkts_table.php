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
            $table->text('implementation_activity')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        \Illuminate\Support\Facades\DB::statement('UPDATE rkts SET implementation_activity = JSON_QUOTE(implementation_activity) WHERE NOT JSON_VALID(implementation_activity)');

        Schema::table('rkts', function (Blueprint $table) {
            $table->jsonb('implementation_activity')->change();
        });
    }
};
