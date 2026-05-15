<?php

use App\Http\Controllers\Inventory\AuditLogController;
use App\Http\Controllers\Inventory\CategoryController;
use App\Http\Controllers\Inventory\DailyClosingController;
use App\Http\Controllers\Inventory\ExpenseController;
use App\Http\Controllers\Inventory\LowStockAlertController;
use App\Http\Controllers\Inventory\OrderDeliveryController;
use App\Http\Controllers\Inventory\PackagingLogController;
use App\Http\Controllers\Inventory\ProductController;
use App\Http\Controllers\Inventory\PurchaseController;
use App\Http\Controllers\Inventory\ReportController;
use App\Http\Controllers\Inventory\SaleController;
use App\Http\Controllers\Inventory\StockAdjustmentController;
use App\Http\Controllers\Inventory\StockController;
use App\Http\Controllers\Inventory\StockCountController;
use App\Http\Controllers\Inventory\SupplierController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('categories', CategoryController::class);
    Route::resource('suppliers', SupplierController::class);
    Route::get('products/search', [ProductController::class, 'search'])->name('products.search');
    Route::resource('products', ProductController::class);
    Route::resource('purchases', PurchaseController::class)->except(['destroy']);
    Route::post('purchases/{purchase}/arrive', [PurchaseController::class, 'arrive'])->name('purchases.arrive');
    Route::resource('sales', SaleController::class)->except(['destroy']);
    Route::get('pos', [SaleController::class, 'pos'])->name('pos');
    Route::post('sales/{sale}/cancel', [SaleController::class, 'cancel'])->name('sales.cancel');
    Route::post('sales/{sale}/return', [SaleController::class, 'return'])->name('sales.return');
    Route::get('sales/{sale}/confirm-delivery', [SaleController::class, 'confirmDelivery'])->name('sales.confirm-delivery');
    Route::post('sales/{sale}/confirm-delivery', [SaleController::class, 'storeDeliveryConfirmation'])->name('sales.confirm-delivery.store');
    Route::post('sales/{sale}/exchange', [SaleController::class, 'exchange'])->name('sales.exchange');
    Route::post('sales/{sale}/update-payment', [SaleController::class, 'updatePayment'])->name('sales.update-payment');
    Route::get('stock', [StockController::class, 'index'])->name('stock.index');
    Route::get('stock/movements', [StockController::class, 'movements'])->name('stock.movements');

    Route::resource('expenses', ExpenseController::class)->except(['show']);
    Route::resource('stock-adjustments', StockAdjustmentController::class)->except(['edit', 'update', 'destroy']);
    Route::post('stock-adjustments/{stock_adjustment}/approve', [StockAdjustmentController::class, 'approve'])->name('stock-adjustments.approve');
    Route::resource('stock-counts', StockCountController::class)->except(['edit', 'update', 'destroy']);
    Route::post('stock-counts/{stock_count}/approve', [StockCountController::class, 'approve'])->name('stock-counts.approve');
    Route::resource('daily-closings', DailyClosingController::class)->except(['edit', 'update', 'destroy']);
    Route::get('reports/daily', [ReportController::class, 'daily'])->name('reports.daily');
    Route::get('reports/daily/export', [ReportController::class, 'exportDailyCsv'])->name('reports.daily.export');
    Route::get('reports/monthly', [ReportController::class, 'monthly'])->name('reports.monthly');
    Route::get('reports/monthly/export', [ReportController::class, 'exportMonthlyCsv'])->name('reports.monthly.export');
    Route::get('reports/profit', [ReportController::class, 'profit'])->name('reports.profit');
    Route::get('reports/category-profit', [ReportController::class, 'categoryProfit'])->name('reports.category-profit');
    Route::get('reports/stock-value', [ReportController::class, 'stockValue'])->name('reports.stock-value');
    Route::get('reports/stock-loss', [ReportController::class, 'stockLoss'])->name('reports.stock-loss');
    Route::get('reports/delivery-failed', [ReportController::class, 'deliveryFailed'])->name('reports.delivery-failed');
    Route::get('low-stock', [LowStockAlertController::class, 'index'])->name('low-stock.index');
    Route::get('audit-logs', [AuditLogController::class, 'index'])->name('audit-logs.index');

    Route::get('sales/{sale}/delivery', [OrderDeliveryController::class, 'show'])->name('sales.delivery.show');
    Route::post('sales/{sale}/delivery', [OrderDeliveryController::class, 'storeOrUpdate'])->name('sales.delivery.store');
    Route::get('sales/{sale}/packaging', [PackagingLogController::class, 'show'])->name('sales.packaging.show');
    Route::post('sales/{sale}/packaging', [PackagingLogController::class, 'storeOrUpdate'])->name('sales.packaging.store');
});
