<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ReportController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth')->group(function () {
    Route::get('/', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/dashboard/report/{id}', [DashboardController::class, 'detailReport'])->name('detail-report');
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    Route::post('/report', [ReportController::class, 'insert'])->name('insert-report');
    Route::delete('/report/{id}', [ReportController::class, 'delete'])->name('delete-report');
    Route::post('/report/recommendation/{id}', [ReportController::class, 'generateRecommendation'])->name('generate-recommendation');
    Route::patch('/rkt/{id}', [ReportController::class, 'updateRkt'])->name('rkt.update');
});

require __DIR__ . '/auth.php';
