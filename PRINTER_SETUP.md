# 🖨️ Auto-Print Receipt Setup Guide

## Prerequisites

1. **ESC/POS Printer Server** running on your network
   - GitHub: https://github.com/darkterminal/escpos-printer-server
   - Should be accessible via WebSocket (e.g., `ws://192.168.110.176:1945`)

2. **Thermal Printer** connected to the server
   - USB or Network printer
   - Compatible with ESC/POS commands

## Installation Steps

### Step 1: Install WebSocket Client

```bash
composer require textalk/websocket
```

### Step 2: Configure Environment Variables

Add these to your `.env` file:

```env
# Printer Configuration
PRINTER_ENABLED=true
PRINTER_SERVER_URL=ws://192.168.110.176:1945
PRINTER_NAME=smb://localhost/XP-80C
PRINTER_NAME_SHORT=XP-80C
PRINTER_PULL_CASH_DRAWER=false
PRINTER_AUTO_PRINT=true
```

**Configuration Options:**

- `PRINTER_ENABLED`: Set to `true` to enable auto-printing
- `PRINTER_SERVER_URL`: WebSocket URL of your printer server
- `PRINTER_NAME`: Full printer path (Windows: `smb://localhost/PrinterName`, Linux: `/dev/usb/lp0`, Network: `192.168.1.100`)
- `PRINTER_NAME_SHORT`: Short printer name (e.g., `XP-80C`)
- `PRINTER_PULL_CASH_DRAWER`: Set to `true` to open cash drawer after printing
- `PRINTER_AUTO_PRINT`: Set to `true` to auto-print after sale, `false` to require manual click

### Step 3: Update SaleController

The `SaleController@store` method has been updated to automatically print receipts after sale creation.

### Step 4: Test the Printer

Create a test route to verify printer connection:

```php
// routes/web.php
Route::get('/test-printer', function () {
    $printerService = app(\App\Services\PrinterService::class);
    
    if ($printerService->testPrinter()) {
        return 'Printer connection successful! ✅';
    }
    
    return 'Printer connection failed! ❌';
})->middleware('auth');
```

Visit `/test-printer` to check if the printer server is reachable.

### Step 5: Test with a Real Sale

1. Go to POS (`/pos`)
2. Add products to cart
3. Complete a sale
4. Receipt should print automatically (if `PRINTER_AUTO_PRINT=true`)

## Troubleshooting

### Printer Not Printing

1. **Check printer server is running**
   ```bash
   # On the printer server machine
   # Make sure the ESC/POS server is running
   ```

2. **Check WebSocket connection**
   - Open `test-print-custom.html` in browser
   - Click "Test Print"
   - Check browser console for errors

3. **Check Laravel logs**
   ```bash
   tail -f storage/logs/laravel.log
   ```

4. **Verify printer name**
   - Windows: Check printer name in Control Panel > Devices and Printers
   - Linux: Check `/dev/usb/` or use `lpstat -p -d`

### Common Issues

**Issue: "WebSocket connection failed"**
- Solution: Check `PRINTER_SERVER_URL` is correct
- Solution: Ensure printer server is running and accessible

**Issue: "Printer not found"**
- Solution: Verify `PRINTER_NAME` matches actual printer name
- Solution: Check printer is online and connected

**Issue: "Receipt prints but is blank"**
- Solution: Check printer has paper
- Solution: Verify printer supports ESC/POS commands

**Issue: "Receipt prints garbled text"**
- Solution: Check font files exist (for image-based printing)
- Solution: Verify character encoding (UTF-8)

## Manual Print Option

If auto-print is disabled (`PRINTER_AUTO_PRINT=false`), users can still print manually:

1. After completing sale, click "Print Receipt" button
2. Or visit the sale detail page and click "Print Receipt"

## Advanced Configuration

### Custom Receipt Template

Edit `app/Services/PrinterService.php` to customize receipt layout:

```php
private function prepareSaleReceiptData(Sale $sale): array
{
    // Customize receipt data here
    return [
        'invoice_no' => $sale->invoice_no,
        'footer' => 'Your custom footer message',
        // ... more fields
    ];
}
```

### Multiple Printers

To support multiple printers (e.g., kitchen printer, receipt printer):

1. Add printer configurations to `config/printer.php`
2. Create separate methods in `PrinterService`
3. Call appropriate method based on sale type

### Print Queue (Retry Failed Prints)

If printer is offline, print jobs are logged. To implement retry:

1. Create a `print_jobs` database table
2. Store failed print jobs
3. Create a scheduled command to retry failed jobs

```bash
php artisan make:command RetryFailedPrintJobs
```

## Production Checklist

- [ ] Printer server is running on a dedicated machine/server
- [ ] Printer server starts automatically on boot
- [ ] WebSocket URL is accessible from Laravel server
- [ ] Printer is connected and online
- [ ] Test print works successfully
- [ ] Auto-print is enabled in `.env`
- [ ] Laravel logs are monitored for print errors
- [ ] Backup manual print option is available

## Support

For issues with:
- **ESC/POS Printer Server**: https://github.com/darkterminal/escpos-printer-server/issues
- **Laravel Integration**: Check `storage/logs/laravel.log`
- **Printer Hardware**: Consult printer manufacturer documentation
