<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ProductImageController;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;


Route::get('/', function () {
    if (Auth::check()) {
        return redirect('/dashboard');
    }

    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', DashboardController::class)->name('dashboard');
});

Route::get(
    '/img/products/{filename}',
    ProductImageController::class,
)
    ->where('filename', '[A-Za-z0-9._-]+')
    ->name('product-image');

require __DIR__.'/inventory.php';

require __DIR__.'/settings.php';
