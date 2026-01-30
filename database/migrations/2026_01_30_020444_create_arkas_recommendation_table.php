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
        Schema::create('arkas_recommendation', function (Blueprint $table) {
            $table->id();
            $table->foreignId('report_id')->constrained('reports')->onDelete('cascade');
            $table->text('fixing_activity')->nullable(); // Kegiatan Benahi
            $table->text('implementation_description')->nullable(); // Penjelasan Implementasi Kegiatan
            $table->text('arkas_activity')->nullable(); // Kegiatan ARKAS
            $table->text('arkas_activity_description')->nullable(); // Uraian Kegiatan ARKAS
            $table->string('budget_month')->nullable(); // Bulan Dianggarkan
            $table->integer('quantity')->nullable(); // Jumlah
            $table->string('unit')->nullable(); // Satuan
            $table->decimal('unit_price', 15, 2)->nullable(); // Harga Satuan
            $table->decimal('total_price', 15, 2)->nullable(); // Total
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('arkas_recommendation');
    }
};
