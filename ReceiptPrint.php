<?php
declare(strict_types=1);

namespace Darkterminal\EscposPrinterServer;

use Darkterminal\EscposPrinterServer\Utils\CommonTrait;
use Darkterminal\EscposPrinterServer\Utils\LoggerTrait;
use Mike42\Escpos\CapabilityProfile;
use Mike42\Escpos\PrintConnectors\CupsPrintConnector;
use Mike42\Escpos\PrintConnectors\DummyPrintConnector;
use Mike42\Escpos\PrintConnectors\FilePrintConnector;
use Mike42\Escpos\PrintConnectors\NetworkPrintConnector;
use Mike42\Escpos\PrintConnectors\WindowsPrintConnector;
use Mike42\Escpos\Printer;
use Mike42\Escpos\EscposImage;
class ReceiptPrinter
{
    use CommonTrait;
    use LoggerTrait;

    public array $receiptData;
    public array $printerSettings;

    public function __construct() {}

    /**
     * Print receipt based on the provided data
     */
 public function printReceipt(): void
{
    try {
        $connector = $this->createPrinterConnector($this->printerSettings);
        $printer = new Printer($connector);

        $template = $this->printerSettings['template'] ?? 'epson';

        if ($template === 'custom_invoice_image') {
            $this->validateCustomInvoiceImageData($this->receiptData);
            $this->printCustomInvoiceImage($printer, $this->receiptData, $this->printerSettings);

            $printer->cut();

            if ($this->printerSettings['pull_cash_drawer'] ?? false) {
                $printer->pulse();
            }

            $printer->close();

            $this->info(message: 'Custom invoice image printed successfully');

            return;
        }

        if ($template === 'custom_invoice') {
            $this->validateCustomInvoiceData($this->receiptData);
            $this->printCustomInvoice($printer, $this->receiptData, $this->printerSettings);

            $printer->cut();

            if ($this->printerSettings['pull_cash_drawer'] ?? false) {
                $printer->pulse();
            }

            $printer->close();

            $this->info(message: 'Custom invoice printed successfully');

            return;
        }

        // default EPS format
        $this->validateReceiptData($this->receiptData);

        $this->printHeader($printer, $this->receiptData, $this->printerSettings);
        $this->printSubHeader($printer, $this->receiptData, $this->printerSettings);
        $this->printOperatorDetails($printer, $this->receiptData, $this->printerSettings);
        $this->printShoppingDetails($printer, $this->receiptData, $this->printerSettings);
        $this->printPromoSection($printer, $this->receiptData, $this->printerSettings);
        $this->printFooter($printer, $this->receiptData, $this->printerSettings);
        $this->printSubFooter($printer, $this->printerSettings);

        $printer->cut();

        if ($this->printerSettings['pull_cash_drawer'] ?? false) {
            $printer->pulse();
        }

        $printer->close();

        $this->info(message: 'Receipt printed successfully');
    } catch (\Exception $e) {
        $this->error('Failed to print receipt: ' . $e->getMessage());
        throw $e;
    }
}
private function validateCustomInvoiceImageData(array $receiptData): void
{
    $requiredFields = [
        'invoice_no',
        'date',
        'customer_name',
        'phone',
        'location',
        'items',
        'discount',
        'delivery_fee',
        'total',
        'paid',
        'remaining',
        'status',
    ];

    foreach ($requiredFields as $field) {
        if (!array_key_exists($field, $receiptData)) {
            throw new \Exception("Missing required custom invoice image field: {$field}");
        }
    }

    if (!is_array($receiptData['items'])) {
        throw new \Exception('Custom invoice image field items must be an array');
    }
}
private function printCustomInvoiceImage(Printer $printer, array $receiptData, array $printerSettings): void
{
    $imagePath = $this->generateInvoiceImage($receiptData);

    try {
        $image = EscposImage::load($imagePath, false);

        // graphics() is better for most modern thermal printers
        $printer->setJustification(Printer::JUSTIFY_CENTER);
        $printer->bitImage($image);

        $printer->feed($printerSettings['more_new_line'] ?? 3);
    } finally {
        if (file_exists($imagePath)) {
            @unlink($imagePath);
        }
    }
}
private function getInvoiceFonts(): array
{
    $regularFonts = [
        'C:\Windows\Fonts\khmerui.ttf',
        'C:\Windows\Fonts\arial.ttf',
    ];

    $boldFonts = [
        'C:\Windows\Fonts\khmeruib.ttf',
        'C:\Windows\Fonts\arialbd.ttf',
    ];

    $regular = null;
    $bold = null;

    foreach ($regularFonts as $font) {
        if (file_exists($font)) {
            $regular = $font;
            break;
        }
    }

    foreach ($boldFonts as $font) {
        if (file_exists($font)) {
            $bold = $font;
            break;
        }
    }

    if (! $regular) {
        throw new \Exception('No usable invoice regular font found.');
    }

    if (! $bold) {
        $bold = $regular;
    }

    return [$regular, $bold];
}
private function cleanImageText(mixed $value) : string {
    $text = trim((string) $value);
    if (!mb_check_encoding($text, 'UTF-8')) {
        $text = mb_convert_encoding($text,'UTF-8');
    }
    return $text;
}
private function generateInvoiceImage(array $receiptData): string
{
    if (!function_exists('imagecreatetruecolor')) {
        throw new \Exception('GD extension is required for image invoice printing.');
    }

    $width = 576; // full width for 80mm printer
    $padding = 18;
    $contentWidth = $width - ($padding * 2);

    $estimatedHeight = 2000;
    $image = imagecreatetruecolor($width, $estimatedHeight);

    $white = imagecolorallocate($image, 255, 255, 255);
    $black = imagecolorallocate($image, 0, 0, 0);

    imagefill($image, 0, 0, $white);

    [$fontPath, $fontBoldPath] = $this->getInvoiceFonts();

    // Bigger font sizes
    $titleFontSize = 28;
    $headerFontSize = 20;
    $normalFontSize = 20;
    $boldFontSize = 21;
    $tableHeaderFontSize = 20;
    $tableFontSize = 20;
    $summaryFontSize = 21;
    $statusFontSize = 24;
    $footerFontSize = 19;

    $y = 42;

    // Title
    $y = $this->drawCenteredText($image, 'INVOICE', $titleFontSize, $fontBoldPath, $black, $width, $y);
    $y += 10;

    // Basic info
    $y = $this->drawText(
        $image,
        'Invoice: ' . $this->cleanImageText($receiptData['invoice_no']),
        $headerFontSize,
        $fontPath,
        $black,
        $padding,
        $y
    );

    $y = $this->drawText(
        $image,
        'Date: ' . $this->cleanImageText($receiptData['date']),
        $headerFontSize,
        $fontPath,
        $black,
        $padding,
        $y
    );

    // Bold important customer info
    $y = $this->drawText(
        $image,
        'Customer: ' . $this->cleanImageText($receiptData['customer_name']),
        $boldFontSize,
        $fontBoldPath,
        $black,
        $padding,
        $y
    );

    $y = $this->drawText(
        $image,
        'Phone: ' . $this->cleanImageText($receiptData['phone']),
        $boldFontSize,
        $fontBoldPath,
        $black,
        $padding,
        $y
    );

    $y = $this->drawWrappedLabelValue(
        $image,
        'Address:',
        $this->cleanImageText($receiptData['location']),
        $boldFontSize,
        $fontBoldPath,
        $black,
        $padding,
        $contentWidth,
        $y
    );

    if (!empty($receiptData['delivery'])) {
        $y = $this->drawText(
            $image,
            'Delivery: ' . $this->cleanImageText($receiptData['delivery']),
            $boldFontSize,
            $fontBoldPath,
            $black,
            $padding,
            $y
        );
    }

    $y += 10;
    imageline($image, $padding, $y, $width - $padding, $y, $black);
    $y += 36;

    // Table header
    $productX = $padding;
    $qtyX = 420;
    $totalX = 490;

    imagettftext($image, $tableHeaderFontSize, 0, $productX, $y, $black, $fontBoldPath, 'Product');
    imagettftext($image, $tableHeaderFontSize, 0, $qtyX, $y, $black, $fontBoldPath, 'Qty');
    imagettftext($image, $tableHeaderFontSize, 0, $totalX, $y, $black, $fontBoldPath, 'Total');
    $y += 28;

    foreach ($receiptData['items'] as $item) {
        $product = $this->cleanImageText($item['product'] ?? 'Product');
        $qty = (string) ($item['qty'] ?? 0);
        $total = $this->usd($item['total'] ?? 0);

        $wrappedLines = $this->wrapTextByWidth($product, $tableFontSize, $fontPath, 350);

        foreach ($wrappedLines as $lineIndex => $line) {
            imagettftext($image, $tableFontSize, 0, $productX, $y, $black, $fontPath, $line);

            if ($lineIndex === 0) {
                imagettftext($image, $tableFontSize, 0, $qtyX, $y, $black, $fontPath, $qty);
                imagettftext($image, $tableFontSize, 0, $totalX, $y, $black, $fontPath, $total);
            }

            $y += 28;
        }
    }

    imageline($image, $padding, $y, $width - $padding, $y, $black);
    $y += 38;

    // Summary
    $y = $this->drawAmountLineImage($image, 'Discount', $this->usd($receiptData['discount'] ?? 0), $summaryFontSize, $fontPath, $black, $padding, $width, $y);
    $y = $this->drawAmountLineImage($image, 'Delivery Fee', $this->usd($receiptData['delivery_fee'] ?? 0), $summaryFontSize, $fontPath, $black, $padding, $width, $y);
    $y = $this->drawAmountLineImage($image, 'Total', $this->usd($receiptData['total'] ?? 0), $summaryFontSize, $fontBoldPath, $black, $padding, $width, $y);
    $y = $this->drawAmountLineImage($image, 'Paid', $this->usd($receiptData['paid'] ?? 0), $summaryFontSize, $fontPath, $black, $padding, $width, $y);
    $y = $this->drawAmountLineImage($image, 'Remaining', $this->usd($receiptData['remaining'] ?? 0), $summaryFontSize, $fontPath, $black, $padding, $width, $y);

    imageline($image, $padding, $y, $width - $padding, $y, $black);
    $y += 40;

    // Status
    $status = strtoupper($this->cleanImageText($receiptData['status'] ?? ''));

    if (($status === 'UNPAID' || $status === 'PARTIAL') && (float) ($receiptData['remaining'] ?? 0) > 0) {
        $statusText = 'Status: ' . $status . ' | Remaining: ' . $this->usd($receiptData['remaining']);
    } else {
        $statusText = 'Status: ' . $status;
    }

    $y = $this->drawCenteredText($image, $statusText, $statusFontSize, $fontBoldPath, $black, $width, $y);

    imageline($image, $padding, $y + 6, $width - $padding, $y + 6, $black);
    $y += 42;

    // Footer
    $footer = $receiptData['footer'] ?? 'Thank you for supporting us <3';
    $y = $this->drawCenteredText($image, $this->cleanImageText($footer), $footerFontSize, $fontPath, $black, $width, $y);

    $y += 20;

    // Crop image to content
    $finalHeight = max($y + 20, 200);
    $cropped = imagecreatetruecolor($width, $finalHeight);
    imagefill($cropped, 0, 0, $white);
    imagecopy($cropped, $image, 0, 0, 0, 0, $width, $finalHeight);

    $tmpPath = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'invoice_' . uniqid() . '.png';
    imagepng($cropped, $tmpPath);

    imagedestroy($image);
    imagedestroy($cropped);

    return $tmpPath;
}
private function drawText($image, string $text, int $size, string $font, int $color, int $x, int $y): int
{
    imagettftext($image, $size, 0, $x, $y, $color, $font, $text);

    return $y + 32;
}

private function drawCenteredText($image, string $text, int $size, string $font, int $color, int $width, int $y): int
{
    $box = imagettfbbox($size, 0, $font, $text);
    $textWidth = $box[2] - $box[0];
    $x = (int) (($width - $textWidth) / 2);

    imagettftext($image, $size, 0, $x, $y, $color, $font, $text);

    return $y + 36;
}

private function drawWrappedLabelValue($image, string $label, string $value, int $size, string $font, int $color, int $x, int $maxWidth, int $y): int
{
    $full = $label . ' ' . $value;
    $lines = $this->wrapTextByWidth($full, $size, $font, $maxWidth);

    foreach ($lines as $line) {
        imagettftext($image, $size, 0, $x, $y, $color, $font, $line);
        $y += 32;
    }

    return $y;
}

private function drawAmountLineImage($image, string $label, string $amount, int $size, string $font, int $color, int $padding, int $width, int $y): int
{
    imagettftext($image, $size, 0, $padding, $y, $color, $font, $label);

    $box = imagettfbbox($size, 0, $font, $amount);
    $amountWidth = $box[2] - $box[0];
    $x = $width - $padding - $amountWidth;

    imagettftext($image, $size, 0, $x, $y, $color, $font, $amount);

    return $y + 34;
}

private function wrapTextByWidth(string $text, int $fontSize, string $fontPath, int $maxWidth): array
{
    $words = preg_split('/\s+/u', trim($text));
    $lines = [];
    $currentLine = '';

    foreach ($words as $word) {
        $testLine = $currentLine === '' ? $word : $currentLine . ' ' . $word;
        $box = imagettfbbox($fontSize, 0, $fontPath, $testLine);
        $lineWidth = $box[2] - $box[0];

        if ($lineWidth <= $maxWidth) {
            $currentLine = $testLine;
        } else {
            if ($currentLine !== '') {
                $lines[] = $currentLine;
            }
            $currentLine = $word;
        }
    }

    if ($currentLine !== '') {
        $lines[] = $currentLine;
    }

    return $lines;
}

    public function pullCashDrawer(): void
    {
        try {
            $connector = $this->createPrinterConnector($this->printerSettings);
            $printer = new Printer($connector);
            $printer->pulse();
            $printer->close();
            $this->info('Cash drawer pulled successfully');
        } catch (\Exception $e) {
            $this->error('Failed to pull cash drawer: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Test printer functionality
     */
    public function testPrinter(): void
    {
        try {
            $connector = new DummyPrintConnector();
            CapabilityProfile::load("TSP600");
            $printer = new Printer($connector);
            
            // Validate receipt data
            $this->validateReceiptData($this->receiptData);

            // Print all sections
            $this->printHeader(
                $printer,
                $this->receiptData,
                $this->printerSettings
            );
            $this->printSubHeader(
                $printer,
                $this->receiptData,
                $this->printerSettings
            );
            $this->printOperatorDetails(
                $printer,
                $this->receiptData,
                $this->printerSettings
            );
            $this->printShoppingDetails(
                $printer, 
                $this->receiptData, 
                $this->printerSettings
            );
            $this->printPromoSection(
                $printer, 
                $this->receiptData, 
                $this->printerSettings
            );
            $this->printFooter(
                $printer, 
                $this->receiptData, 
                $this->printerSettings
            );
            $this->printSubFooter(
                $printer, 
                $this->printerSettings
            );

            $printer->feed(2);
            $printer->cut();

            $data = $connector->getData();

            echo $data . PHP_EOL;

            $printer->close();

            $this->info('Printer test completed');
        } catch (\Exception $e) {
            $this->error('Printer test failed: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Create printer connector based on settings
     */
    private function createPrinterConnector(array $settings): CupsPrintConnector|FilePrintConnector|NetworkPrintConnector|WindowsPrintConnector
    {
        $allowed_interfaces = ['cups', 'ethernet', 'linux-usb', 'smb', 'windows-usb', 'windows-lpt'];

        if (!in_array($settings['interface'] ?? '', $allowed_interfaces)) {
            throw new \Exception('Invalid printer interface: ' . ($settings['interface'] ?? 'none'));
        }

        switch ($settings['interface']) {
            case 'cups':
                return new CupsPrintConnector($settings['printer_name']);
            case 'ethernet':
                $host = $settings['printer_host'] ?? $settings['printer_name'];
                $port = $settings['printer_port'] ?? 9100;
                return new NetworkPrintConnector($host, $port);
            case 'linux-usb':
                return new FilePrintConnector($settings['printer_name']);
            case 'smb':
            case 'windows-usb':
            case 'windows-lpt':
            default:
                return new WindowsPrintConnector($settings['printer_name']);
        }
    }

    /**
     * Validate receipt data structure
     */
    private function validateReceiptData(array $receiptData): void
    {
        $required_fields = ['app_name', 'full_name', 'transaction', 'cart'];

        foreach ($required_fields as $field) {
            if (!isset($receiptData[$field])) {
                throw new \Exception("Missing required receipt field: $field");
            }
        }

        if (isset($receiptData['transaction'])) {
            $required_transaction_fields = ['date_transaction', 'transaction', 'total_transaction'];
            foreach ($required_transaction_fields as $field) {
                if (!isset($receiptData['transaction'][$field])) {
                    throw new \Exception("Missing required transaction field: $field");
                }
            }
        }
    }

    /**
     * Get font settings based on template
     */
    private function getFontSettings(string $template): array
    {
        $selectPrinterFont = [
            'A' => Printer::FONT_A,
            'B' => Printer::FONT_B,
            'C' => Printer::FONT_C
        ];

        if ($template === 'epson') {
            return [
                'header_receipt' => $selectPrinterFont['B'],
                'sub_header_receipt' => $selectPrinterFont['B'],
                'detail_operator' => $selectPrinterFont['C'],
                'detail_cart' => $selectPrinterFont['C'],
                'sub_promo' => $selectPrinterFont['B'],
                'footer' => $selectPrinterFont['C'],
                'sub_footer' => $selectPrinterFont['B']
            ];
        } else {
            return [
                'header_receipt' => $selectPrinterFont['C'],
                'sub_header_receipt' => $selectPrinterFont['C'],
                'detail_operator' => $selectPrinterFont['C'],
                'detail_cart' => $selectPrinterFont['C'],
                'sub_promo' => $selectPrinterFont['C'],
                'footer' => $selectPrinterFont['C'],
                'sub_footer' => $selectPrinterFont['C']
            ];
        }
    }

    /**
     * Print receipt header
     */
    private function printHeader(Printer $printer, array $receiptData, array $printerSettings): void
    {
        $fontSettings = $this->getFontSettings($printerSettings['template']);
        $column_width = ($printerSettings['template'] === 'epson') ? 40 : 48;

        $printer->initialize();
        $printer->selectPrintMode(Printer::MODE_DOUBLE_HEIGHT);
        $printer->setJustification(Printer::JUSTIFY_CENTER);
        $printer->setFont($fontSettings['header_receipt']);
        $printer->setEmphasis(true);
        $printer->text($receiptData['app_name'] . "\n");
        $printer->setEmphasis(false);
        $printer->feed(1);
    }

    /**
     * Print receipt sub header
     */
    private function printSubHeader(Printer $printer, array $receiptData, array $printerSettings): void
    {
        $fontSettings = $this->getFontSettings($printerSettings['template']);

        $printer->initialize();
        $printer->setJustification(Printer::JUSTIFY_CENTER);
        $printer->setFont($fontSettings['sub_header_receipt']);
        $printer->setEmphasis(true);

        if (!empty($printerSettings['custom_print_header'])) {
            foreach ($printerSettings['custom_print_header'] as $header_line) {
                $header_text = str_replace(['\r\n', '<br>', '<br/>'], "\n", $header_line);
                $printer->text(strtoupper($header_text) . "\n");
            }
        } else {
            $printer->text("SERVING WHOLEHEARTEDLY\n");
            $printer->text(strtoupper(str_replace(["<br>", "<br/>"], "", $receiptData['store_address'] ?? "Default Address")) . "\n");
            $printer->text("Open 07:30 - 16:30\n");
        }

        $printer->setEmphasis(false);
        $printer->feed(1);
    }

    /**
     * Print operator details
     */
    private function printOperatorDetails(Printer $printer, array $receiptData, array $printerSettings): void
    {
        $fontSettings = $this->getFontSettings($printerSettings['template']);
        $column_width = ($printerSettings['template'] === 'epson') ? 40 : 48;
        $optnl = ($printerSettings['template'] === 'epson') ? 0 : ($printerSettings['more_new_line'] ?? 0);
        $more_new_line = str_repeat("\n", $optnl);
        $divider = str_repeat("-", $column_width) . "\n";

        $printer->initialize();
        $printer->setLineSpacing(20);
        $printer->setFont($fontSettings['detail_operator']);
        $printer->setEmphasis(true);
        $printer->text($divider);

        $custom_lang = $printerSettings['custom_language'] ?? [];

        $printer->text($this->makeAlignText(
            ($custom_lang['operator'] ?? 'Operator') . " : ",
            $receiptData['full_name'] . $more_new_line,
            $column_width
        ));

        $date_transaction = $receiptData['transaction']['date_transaction'] !== date('Y-m-d')
            ? $receiptData['transaction']['date_transaction']
            : date('Y-m-d');

        $printer->text($this->makeAlignText(
            ($custom_lang['time'] ?? 'Time') . " : ",
            $date_transaction . ' ' . date('H:i:s') . $more_new_line,
            $column_width
        ));

        $printer->text($this->makeAlignText(
            ($custom_lang['transaction_number'] ?? 'Transaction Number') . " : ",
            $receiptData['transaction']['transaction'] . $more_new_line,
            $column_width
        ));

        $printer->text($this->makeAlignText(
            ($custom_lang['customer_name'] ?? 'Customer Name') . " : ",
            ($receiptData['transaction']['customer_name'] ?? 'Walk-in Customer') . $more_new_line,
            $column_width
        ));

        $printer->text($divider);
        $printer->setEmphasis(false);
        $printer->feed(1);
    }

    /**
     * Print shopping details
     */
    private function printShoppingDetails(Printer $printer, array $receiptData, array $printerSettings): void
    {
        $fontSettings = $this->getFontSettings($printerSettings['template']);

        $printer->initialize();
        $printer->setLineSpacing(20);
        $printer->setFont($fontSettings['detail_cart']);
        $printer->setEmphasis(true);

        foreach ($receiptData['cart'] as $item) {
            $sub_total_price = $item['sub_total'] ?? (int) $item['price'] * (int) $item['qty'];
            $printer->text($this->makeWrapText(
                $item['item_name'],
                $this->toIDR($sub_total_price, false),
                $printerSettings['template']
            ));
            $printer->text('@ ' . $this->toIDR($item['price'], true) . " x " . $item['qty'] . "\n");
            $printer->feed($printerSettings['line_feed_each_in_items'] ?? 1);
        }

        $printer->setEmphasis(false);
        $printer->feed(1);
    }

    /**
     * Print promotional section
     */
    private function printPromoSection(Printer $printer, array $receiptData, array $printerSettings): void
    {
        if (empty($receiptData['promo'])) {
            return;
        }

        $fontSettings = $this->getFontSettings($printerSettings['template']);
        $column_width = ($printerSettings['template'] === 'epson') ? 40 : 48;
        $divider = str_repeat("-", $column_width) . "\n";

        $printer->initialize();
        $printer->setLineSpacing(20);
        $printer->feed(1);
        $printer->setJustification(Printer::JUSTIFY_CENTER);
        $printer->setFont($fontSettings['sub_promo']);
        $printer->setEmphasis(true);
        $printer->text($divider);

        foreach ($receiptData['promo'] as $promo) {
            $printer->text(wordwrap($promo, 35, "\n") . "\n\n");
        }

        $printer->setEmphasis(false);
        $printer->feed(3);
    }

    /**
     * Print receipt footer
     */
    private function printFooter(Printer $printer, array $receiptData, array $printerSettings): void
    {
        $fontSettings = $this->getFontSettings($printerSettings['template']);
        $column_width = ($printerSettings['template'] === 'epson') ? 40 : 48;
        $optnl = ($printerSettings['template'] === 'epson') ? 0 : ($printerSettings['more_new_line'] ?? 0);
        $more_new_line = str_repeat("\n", $optnl);
        $divider = str_repeat("-", $column_width) . "\n";

        $printer->initialize();
        $printer->setLineSpacing(20);
        $printer->setFont($fontSettings['footer']);
        $printer->setEmphasis(true);
        $printer->text($divider);

        $custom_lang = $printerSettings['custom_language'] ?? [];

        // Tax
        if (($receiptData['transaction']['tax'] ?? 0) != 0) {
            $printer->text($this->makeAlignText(
                $custom_lang['tax'] ?? 'Tax',
                $this->toIDR($receiptData['transaction']['tax']),
                $column_width
            ) . $more_new_line);
        }

        // Member discount
        if (($receiptData['transaction']['member_discount'] ?? 0) != 0) {
            $printer->text($this->makeAlignText(
                $custom_lang['member'] ?? 'Member Discount',
                $this->toIDR($receiptData['transaction']['member_discount']),
                $column_width
            ) . $more_new_line);
        }

        // Total
        $printer->text($this->makeAlignText(
            $custom_lang['total'] ?? 'Total',
            $this->toIDR($receiptData['transaction']['total_transaction']),
            $column_width
        ) . $more_new_line);

        // Paid amount
        $bayar = ($receiptData['transaction']['paid'] ?? 0) != 0
            ? $this->toIDR($receiptData['transaction']['paid'])
            : '-';
        $printer->text($this->makeAlignText(
            $custom_lang['paid'] ?? 'Paid',
            $bayar,
            $column_width
        ) . $more_new_line);

        // Return amount
        $text_kembalian = ($receiptData['transaction']['payment'] ?? '') != 'Kredit'
            ? $this->toIDR($receiptData['transaction']['paid_return'] ?? 0)
            : '-';
        $printer->text($this->makeAlignText(
            $custom_lang['return'] ?? 'Return',
            $text_kembalian,
            $column_width
        ) . $more_new_line);

        // Credit transaction details
        if (($receiptData['transaction']['payment'] ?? '') == 'Kredit') {
            $printer->text($this->makeAlignText(
                $custom_lang['due_date'] ?? 'Due Date',
                date('d/m/Y', strtotime($receiptData['transaction']['due_date'] ?? date('Y-m-d'))),
                $column_width
            ) . $more_new_line);

            $printer->text($this->makeAlignText(
                $custom_lang['saving'] ?? 'Deposit',
                $this->toIDR($receiptData['transaction']['deposit'] ?? 0),
                $column_width
            ) . $more_new_line);

            $loan_amount = ($receiptData['transaction']['total_transaction'] ?? 0) - ($receiptData['transaction']['deposit'] ?? 0);
            $printer->text($this->makeAlignText(
                $custom_lang['loan'] ?? 'Loan',
                $this->toIDR($loan_amount),
                $column_width
            ) . $more_new_line);
        }

        $printer->setEmphasis(false);
        $printer->feed(1);
    }

    /**
     * Print receipt sub footer
     */
    private function printSubFooter(Printer $printer, $printerSettings): void
    {
        $fontSettings = $this->getFontSettings($printerSettings['template']);

        $printer->initialize();
        $printer->feed(1);
        $printer->setJustification(Printer::JUSTIFY_CENTER);
        $printer->setFont($fontSettings['sub_footer']);
        $printer->setEmphasis(true);

        if (!empty($printerSettings['custom_print_footer'])) {
            $printer->text("Thank you for shopping at\n");
            foreach ($printerSettings['custom_print_footer'] as $footer_line) {
                $printer->text("{$footer_line}\n");
            }
        } else {
            $printer->text("Thank you for shopping at\n");
            $printer->text("Your Store Name\n");
            $printer->text("Items that have been purchased cannot be\n");
            $printer->text("returned. Please take your receipt.\n");
        }

        $printer->setEmphasis(false);
        $printer->feed(3);
    }

    private function validateCustomInvoiceData(array $receiptData): void
{
    $requiredFields = [
        'invoice_no',
        'date',
        'customer_name',
        'phone',
        'location',
        'delivery',
        'items',
        'discount',
        'delivery_fee',
        'total',
        'paid',
        'remaining',
        'status',
    ];

    foreach ($requiredFields as $field) {
        if (!array_key_exists($field, $receiptData)) {
            throw new \Exception("Missing required custom invoice field: {$field}");
        }
    }

    if (!is_array($receiptData['items'])) {
        throw new \Exception('Custom invoice field items must be an array');
    }
}

private function printCustomInvoice(Printer $printer, array $receiptData, array $printerSettings): void
{
    // FONT_A is bigger. Use 32 chars.
    $width = 32;
    $divider = str_repeat('-', $width) . "\n";

    $printer->initialize();
    $printer->setLineSpacing(30);
    $printer->setFont(Printer::FONT_A);

    // Title
    $printer->setJustification(Printer::JUSTIFY_CENTER);
    $printer->setEmphasis(true);
    $printer->text("INVOICE\n");
    $printer->setEmphasis(false);
    $printer->feed(1);

    // Invoice info
    $printer->setJustification(Printer::JUSTIFY_LEFT);

    $printer->text("Invoice: " . $this->safeText($receiptData['invoice_no']) . "\n");
    $printer->text("Date: " . $this->safeText($receiptData['date']) . "\n");

    $printer->setEmphasis(true);
    $printer->text("Customer: " . $this->safeText($receiptData['customer_name']) . "\n");
    $printer->text("Phone: " . $this->safeText($receiptData['phone']) . "\n");
    $printer->text("Address: " . $this->safeText($receiptData['location']) . "\n");
    $printer->setEmphasis(false);

    $printer->text($divider);

    // Items
    $printer->setEmphasis(true);
    $printer->text("Product\n");
    $printer->setEmphasis(false);

    foreach ($receiptData['items'] as $item) {
        $product = $this->safeText($item['product'] ?? 'Product');
        $qty = (string) ($item['qty'] ?? 0);
        $total = $this->usd($item['total'] ?? 0);

        $this->printInvoiceItemLarge($printer, $product, $qty, $total);
    }

    $printer->text($divider);

    // Summary
    $printer->text($this->invoiceAmountLineLarge('Discount', $this->usd($receiptData['discount'] ?? 0)));
    $printer->text($this->invoiceAmountLineLarge('Delivery Fee', $this->usd($receiptData['delivery_fee'] ?? 0)));

    $printer->setEmphasis(true);
    $printer->text($this->invoiceAmountLineLarge('Total', $this->usd($receiptData['total'] ?? 0)));
    $printer->text($this->invoiceAmountLineLarge('Paid', $this->usd($receiptData['paid'] ?? 0)));
    $printer->text($this->invoiceAmountLineLarge('Remaining', $this->usd($receiptData['remaining'] ?? 0)));
    $printer->setEmphasis(false);

    $printer->text($divider);

    // Status
    $status = strtoupper($this->safeText($receiptData['status'] ?? ''));

    $printer->setJustification(Printer::JUSTIFY_CENTER);
    $printer->setEmphasis(true);

    if ($status === 'UNPAID' || $status === 'PARTIAL') {
        $printer->text("Status: {$status}\n");
        $printer->text("Remaining: " . $this->usd($receiptData['remaining'] ?? 0) . "\n");
    } else {
        $printer->text("Status: {$status}\n");
    }

    $printer->setEmphasis(false);

    $printer->setJustification(Printer::JUSTIFY_LEFT);
    $printer->text($divider);

    // Footer
    $printer->setJustification(Printer::JUSTIFY_CENTER);
    $printer->text(($receiptData['footer'] ?? 'Thank you for supporting us <3') . "\n");

    $printer->feed($printerSettings['more_new_line'] ?? 3);
}
private function printInvoiceItemLarge(Printer $printer, string $product, string $qty, string $total): void
{
    // Product name uses full line.
    $product = $this->safeText($product);

    // Wrap product name at 32 chars.
    $lines = str_split($product, 32);

    foreach ($lines as $line) {
        $printer->text($line . "\n");
    }

    // Second line uses full width:
    // "Qty: 1                     $6.00"
    $printer->text($this->invoiceQtyTotalLine($qty, $total));
}

private function invoiceQtyTotalLine(string $qty, string $total): string
{
    $left = "Qty: " . $qty;

    return str_pad($left, 18)
        . str_pad($total, 14, ' ', STR_PAD_LEFT)
        . "\n";
}

private function invoiceAmountLineLarge(string $label, string $amount): string
{
    // Total width = 32
    $labelWidth = 18;
    $amountWidth = 14;

    $label = substr($label, 0, $labelWidth);
    $amount = substr($amount, 0, $amountWidth);

    return str_pad($label, $labelWidth)
        . str_pad($amount, $amountWidth, ' ', STR_PAD_LEFT)
        . "\n";
}

private function invoiceAmountLine(string $label, string $amount): string
{
    // Total width = 42
    $labelWidth = 26;
    $amountWidth = 16;

    $label = substr($label, 0, $labelWidth);
    $amount = substr($amount, 0, $amountWidth);

    return str_pad($label, $labelWidth)
        . str_pad($amount, $amountWidth, ' ', STR_PAD_LEFT)
        . "\n";
}
// private function invoiceAmountLine(string $label, string $amount): string
// {
//     $labelWidth = 18;
//     $amountWidth = 14;

//     $label = substr($label, 0, $labelWidth);
//     $amount = substr($amount, 0, $amountWidth);

//     return str_pad($label, $labelWidth)
//         . str_pad($amount, $amountWidth, ' ', STR_PAD_LEFT)
//         . "\n";
// }


private function customRow(string $product, string $qty, string $total): string
{
    $product = mb_strimwidth($product, 0, 24, '', 'UTF-8');
    $qty = mb_strimwidth($qty, 0, 5, '', 'UTF-8');
    $total = mb_strimwidth($total, 0, 10, '', 'UTF-8');

    return str_pad($product, 24)
        . str_pad($qty, 5, ' ', STR_PAD_LEFT)
        . str_pad($total, 11, ' ', STR_PAD_LEFT)
        . "\n";
}


private function customAmountLine(string $label, string $amount): string
{
    $width = 40;

    $label = substr($label, 0, 24);
    $amount = substr($amount, 0, 16);

    return str_pad($label, 24)
        . str_pad($amount, $width - 24, ' ', STR_PAD_LEFT)
        . "\n";
}

private function usd(mixed $value): string
{
    return '$' . number_format((float) $value, 2);
}

private function safeText(mixed $value): string
{
    return trim((string) $value);
}
}
