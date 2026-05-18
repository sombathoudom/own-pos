<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Receipt {{ $sale['invoice_no'] }}</title>
    <style>
        @page {
            size: 80mm auto;
            margin: 4mm;
        }

        body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            margin: 0;
            color: #000;
        }

        .receipt {
            width: 72mm;
            margin: 0 auto;
        }

        .center {
            text-align: center;
        }

        .section {
            margin-top: 8px;
        }

        .divider {
            border-top: 1px dashed #000;
            margin: 8px 0;
        }

        table {
            width: 100%;
            border-collapse: collapse;
        }

        th, td {
            padding: 2px 0;
            vertical-align: top;
        }

        .text-end {
            text-align: right;
        }

        .totals td {
            padding: 2px 0;
        }

        .status-note {
            margin-top: 8px;
            padding: 6px 0;
            font-weight: bold;
        }

        .meta-line {
            margin-bottom: 2px;
            word-break: break-word;
        }

        .customer-line {
            font-size: 13px;
            font-weight: bold;
        }

        .print-actions {
            margin: 12px auto;
            width: 72mm;
            display: flex;
            gap: 8px;
        }

        .print-actions button,
        .print-actions a {
            flex: 1;
            border: 1px solid #000;
            background: #fff;
            color: #000;
            padding: 8px;
            text-align: center;
            text-decoration: none;
            cursor: pointer;
        }

        @media print {
            .print-actions {
                display: none;
            }
        }
    </style>
</head>
<body>
    <div class="print-actions">
        <button type="button" onclick="window.print()">Print</button>
        <a href="{{ route('sales.show', $sale['id']) }}">Back</a>
    </div>

    <div class="receipt">
        <div class="center">
            <strong>INVOICE</strong>
        </div>

        <div class="section">
            <div class="meta-line"><strong>Invoice:</strong> {{ $sale['invoice_no'] }}</div>
            <div class="meta-line"><strong>Date:</strong> {{ $sale['sale_date'] }}</div>
            <div class="meta-line customer-line"><strong>Customer:</strong> {{ $sale['customer_name'] ?: 'Walk-in' }}</div>
            @if ($sale['customer_phone'])
                <div class="meta-line customer-line"><strong>Phone:</strong> {{ $sale['customer_phone'] }}</div>
            @endif
            @if ($sale['customer_address'])
                <div class="meta-line customer-line"><strong>Location:</strong> {{ $sale['customer_address'] }}</div>
            @endif
            @if ($sale['delivery_company_name'])
                <div class="meta-line customer-line"><strong>Delivery:</strong> {{ $sale['delivery_company_name'] }}</div>
            @endif
        </div>

        <div class="divider"></div>

        <table>
            <thead>
                <tr>
                    <th>Product</th>
                    <th class="text-end">Qty</th>
                    <th class="text-end">Total</th>
                </tr>
            </thead>
            <tbody>
                @foreach ($sale['items'] as $item)
                    <tr>
                        <td>{{ $item['product_name'] }}</td>
                        <td class="text-end">{{ $item['qty'] }}</td>
                        <td class="text-end">${{ number_format((float) $item['total_usd'], 2) }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>

        <div class="divider"></div>

        <table class="totals">
            <tr>
                <td>Discount</td>
                <td class="text-end">${{ number_format((float) $sale['discount_usd'], 2) }}</td>
            </tr>
            <tr>
                <td>Delivery Fee</td>
                <td class="text-end">${{ number_format((float) $sale['customer_delivery_fee_usd'], 2) }}</td>
            </tr>
            <tr>
                <td><strong>Total</strong></td>
                <td class="text-end"><strong>${{ number_format((float) $sale['total_usd'], 2) }}</strong></td>
            </tr>
            <tr>
                <td>Paid</td>
                <td class="text-end">${{ number_format((float) $sale['paid_usd'], 2) }}</td>
            </tr>
            <tr>
                <td>Remaining</td>
                <td class="text-end">${{ number_format((float) $sale['remaining_usd'], 2) }}</td>
            </tr>
        </table>

        <div class="divider"></div>
        <div class="status-note center">
            Status: {{ strtoupper($sale['payment_status']) }}
            @if ((float) $sale['remaining_usd'] > 0)
                | Remaining: ${{ number_format((float) $sale['remaining_usd'], 2) }}
            @endif
        </div>
        <div class="divider"></div>
        <div class="center">Thank you for supporting us &lt;3</div>
    </div>
</body>
</html>
