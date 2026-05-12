<?php

use App\Http\Controllers\Inventory\CategoryController;
use App\Http\Controllers\Inventory\ProductController;
use App\Http\Controllers\Inventory\PurchaseController;
use App\Http\Controllers\Inventory\StockController;
use App\Http\Controllers\Inventory\SupplierController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('categories', CategoryController::class);
    Route::resource('suppliers', SupplierController::class);
    Route::resource('products', ProductController::class);
    Route::resource('purchases', PurchaseController::class)->except(['edit', 'update', 'destroy']);
    Route::get('stock', [StockController::class, 'index'])->name('stock.index');
    Route::get('stock/movements', [StockController::class, 'movements'])->name('stock.movements');
});
