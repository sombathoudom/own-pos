# Clothing Store POS System — Implementation Brief for Codex

## 1. Project Goal

Build a POS/inventory system for a clothing store that can accurately track:

- Product stock by style, size, color, and category
- Purchase cost that changes every time new stock is purchased
- Purchase delivery/import cost included in product cost
- FIFO cost calculation
- Profit/loss per sale, per product, per day, and per month
- Sale cancel, return, and exchange
- Customer delivery status
- Packaging status
- Expenses
- Stock adjustment when real stock and system stock do not match
- USD and KHR payments with fixed exchange rate
- Daily closing report for wife/shop owner
- Monthly summary report

The most important rule:

> Do not directly update only a product stock quantity as the source of truth.  
> Every stock change must create a stock movement record.

The system should be designed so product profit/loss, stock history, delivery, cancellation, and packaging can be traced later without confusion.

---

## 2. Business Context

The store sells shirts in Cambodia.

There are currently 3 selling categories:

1. Shirt selling price around **$6**
2. Shirt selling price around **$8**
3. Shirt selling price around **$15**

Products have multiple styles and sizes.

Example:

- Hawai Blue - M
- Hawai Blue - L
- Hawai Blue - XL
- Premium Black - 2XL
- Korean White - M

A purchase can contain many different categories, styles, and sizes in one supplier shipment.

Example:

```txt
Purchase #001
├── $6 Shirt / Hawai Blue / M / 20 pcs / cost $2.03 / sale $6
├── $6 Shirt / Hawai Blue / L / 30 pcs / cost $2.03 / sale $6
├── $8 Shirt / Premium Black / XL / 25 pcs / cost $3.20 / sale $8
├── $15 Shirt / Korean White / M / 10 pcs / cost $6.50 / sale $15
└── $15 Shirt / Korean White / L / 10 pcs / cost $6.50 / sale $15
```

This should be saved as:

```txt
1 purchase transaction
many purchase_items
```

Do not split into multiple purchase transactions if it is one supplier bill / one delivery shipment.

---

## 3. Core Accounting/Inventory Principle

The system should behave like an accounting ledger.

Every business action creates a record.

Examples:

```txt
Purchase stock      => stock movement +qty
Sale                => stock movement -qty
Cancel sale         => stock movement +qty
Sale return         => stock movement +qty
Exchange old item   => stock movement +qty
Exchange new item   => stock movement -qty
Stock adjustment in => stock movement +qty
Stock adjustment out=> stock movement -qty
Damaged item        => stock movement -qty
Missing item        => stock movement -qty
```

Completed records should not be hard-deleted.

Use:

- cancelled
- returned
- exchanged
- adjustment
- correction
- audit log

This makes the database traceable and prevents reporting mistakes.

---

## 4. Currency Requirement

The shop uses USD and KHR.

Current fixed exchange rate:

```txt
1 USD = 4100 KHR
```

Store exchange rate on every sale, purchase, and expense.

Recommended fields:

```txt
currency
exchange_rate
amount_usd
amount_khr
```

Even if the exchange rate is fixed now, store it per transaction so old reports stay correct if the rate changes later.

---

## 5. Product Structure

Do not track stock only at product level.

Track stock at product variant level.

### Example

```txt
Product: Hawai Shirt
Variant: Blue / XL
```

A variant is the sellable stock item.

### Required Tables

- `categories`
- `products`
- `product_variants`

### `categories`

Stores product categories or price groups.

```sql
id
name
default_sale_price_usd
description
status
created_at
updated_at
```

Example data:

```txt
1 | Shirt $6  | 6.00
2 | Shirt $8  | 8.00
3 | Shirt $15 | 15.00
```

### `products`

Stores main product/style.

```sql
id
category_id
name
description
status
created_at
updated_at
```

Example:

```txt
Hawai Blue
Premium Black
Korean White
```

### `product_variants`

Stores each sellable size/color/style SKU.

```sql
id
product_id
sku
barcode nullable
style_name nullable
color nullable
size
sale_price_usd
status
created_at
updated_at
```

Example:

```txt
Product: Hawai Blue
Variant: Hawai Blue - XL
SKU: HAWAI-BLUE-XL
Size: XL
Sale price: 6.00
```

Important:

- Category price is only a default.
- Product variant price is the current default selling price.
- Actual sale price must be stored on `sale_items`.

---

## 6. Purchase Structure

### Rule

Use this structure:

```txt
One supplier bill / one shipment = one purchase
Many categories / styles / sizes = many purchase_items
```

### `purchases`

Represents the purchase header/main bill.

```sql
id
supplier_id nullable
purchase_no unique
purchase_date
currency
exchange_rate
subtotal_usd
purchase_delivery_cost_usd
other_cost_usd
total_cost_usd
allocation_method
note nullable
created_by
created_at
updated_at
```

Recommended `allocation_method` values:

```txt
by_qty
by_value
manual
```

For the current store, default should be:

```txt
by_qty
```

because most items are shirts and this is easier/faster.

### `purchase_items`

Each row is one category/style/size variant in the purchase.

```sql
id
purchase_id
category_id
product_id
product_variant_id
qty
unit_cost_usd
subtotal_usd
allocated_delivery_cost_usd
allocated_other_cost_usd
landed_unit_cost_usd
total_landed_cost_usd
sale_price_usd
expected_profit_per_unit_usd
created_at
updated_at
```

### Purchase Delivery Cost / Landed Cost

Real businesses usually include purchase delivery/import/freight cost into product cost. This is called **landed cost**.

Formula:

```txt
landed_unit_cost =
supplier_unit_cost
+ purchase_delivery_cost_per_unit
+ other_purchase_cost_per_unit
```

This landed cost is used for:

- FIFO stock layer cost
- COGS
- Gross profit
- Inventory valuation

### Customer Delivery vs Purchase Delivery

There are two different delivery costs:

#### Purchase delivery

Supplier/shipment to shop.

```txt
Add to product landed cost.
Used in FIFO/COGS.
```

#### Customer delivery

Delivery from shop to customer.

```txt
Do not add to product stock cost.
Track separately on sale/order delivery.
```

---

## 7. Delivery Cost Allocation

For this clothing store, default method should be **by quantity**.

Example:

```txt
Purchase delivery cost = $30
Other purchase cost = $5
Total extra cost = $35
Total purchased shirts = 95 pcs

Extra cost per shirt = $35 / 95 = $0.368421
```

Each purchase item:

```txt
landed_unit_cost = unit_cost + extra_cost_per_shirt
```

Example items:

| Category | Variant | Qty | Unit Cost | Sale Price |
|---|---|---:|---:|---:|
| $6 Shirt | Hawai Blue M | 20 | $2.03 | $6 |
| $6 Shirt | Hawai Blue L | 30 | $2.03 | $6 |
| $8 Shirt | Premium Black XL | 25 | $3.20 | $8 |
| $15 Shirt | Korean White M | 10 | $6.50 | $15 |
| $15 Shirt | Korean White L | 10 | $6.50 | $15 |

Total qty:

```txt
95 pcs
```

Extra per item:

```txt
$35 / 95 = $0.368421
```

Landed cost:

| Variant | Cost | Extra/Pc | Landed Cost | Sale Price | Expected Profit |
|---|---:|---:|---:|---:|---:|
| Hawai Blue M | $2.03 | $0.37 | $2.40 | $6 | $3.60 |
| Hawai Blue L | $2.03 | $0.37 | $2.40 | $6 | $3.60 |
| Premium Black XL | $3.20 | $0.37 | $3.57 | $8 | $4.43 |
| Korean White M | $6.50 | $0.37 | $6.87 | $15 | $8.13 |
| Korean White L | $6.50 | $0.37 | $6.87 | $15 | $8.13 |

Important: keep full decimal precision in database. Round only for display.

---

## 8. Stock Layers / FIFO

Every `purchase_item` creates one `stock_layer`.

This is the key to solving changing cost price.

### `stock_layers`

```sql
id
purchase_item_id
product_variant_id
original_qty
remaining_qty
unit_cost_usd
purchase_date
created_at
updated_at
```

`unit_cost_usd` should be the landed unit cost.

Example:

| Layer | Variant | Original Qty | Remaining Qty | Cost |
|---|---|---:|---:|---:|
| Stock 1 | Hawai Blue XL | 100 | 20 | $2.13 |
| Stock 2 | Hawai Blue XL | 100 | 100 | $2.23 |

Even if stock 1 is not finished and stock 2 arrives, keep them separate.

### FIFO Rule

First purchased stock sells first.

When selling `Hawai Blue XL`, the system checks only stock layers for:

```txt
product_variant_id = Hawai Blue XL
remaining_qty > 0
```

Sort by:

```txt
purchase_date ASC
id ASC
```

If customer buys 5 shirts and stock 1 has 3 remaining:

```txt
3 pcs from Stock 1
2 pcs from Stock 2
```

This gives exact cost and profit.

---

## 9. Stock Movements

This table is the stock ledger and source of truth.

### `stock_movements`

```sql
id
product_variant_id
stock_layer_id nullable
type
qty_change
reference_type
reference_id
unit_cost_usd nullable
note nullable
created_by
created_at
```

Recommended `type` values:

```txt
purchase
sale
sale_return
cancel_sale
exchange_in
exchange_out
adjustment_in
adjustment_out
damaged
missing
correction
```

Examples:

```txt
purchase        +100
sale            -2
sale_return     +1
cancel_sale     +2
exchange_in     +1
exchange_out    -1
adjustment_out  -2
```

Current stock can be calculated by:

```sql
SELECT SUM(qty_change)
FROM stock_movements
WHERE product_variant_id = ?
```

This table answers:

- Why did stock change?
- Which sale deducted it?
- Which purchase batch did it come from?
- Who adjusted it?
- When did it happen?

---

## 10. Stock Balances

Use stock balance as a fast cache for display.

### `stock_balances`

```sql
id
product_variant_id unique
qty_on_hand
updated_at
```

Important:

```txt
stock_movements = source of truth
stock_balances = fast cache
```

Every stock transaction should:

1. Insert `stock_movements`
2. Update `stock_balances`

This must be done in a database transaction.

---

## 11. Sales

### `sales`

```sql
id
invoice_no unique
customer_name nullable
customer_phone nullable
sale_date
currency
exchange_rate
subtotal_usd
discount_usd
customer_delivery_fee_usd
actual_delivery_cost_usd
delivery_profit_usd
total_usd
paid_usd
payment_status
order_status
note nullable
created_by
created_at
updated_at
```

Recommended `payment_status`:

```txt
unpaid
partial
paid
refunded
```

Recommended `order_status`:

```txt
draft
confirmed
packed
delivering
completed
cancelled
returned
partially_returned
exchanged
```

### `sale_items`

```sql
id
sale_id
product_variant_id
qty
unit_price_usd
discount_usd
total_usd
cogs_usd
profit_usd
created_at
updated_at
```

Important:

Store COGS and profit at sale time.

Do not calculate old sale profit from the current product cost later.

Formula:

```txt
product_profit = sale_total - COGS
```

---

## 12. Sale Item Cost Layers

This table links sale items to FIFO stock layers.

### `sale_item_cost_layers`

```sql
id
sale_item_id
stock_layer_id
qty
unit_cost_usd
total_cost_usd
created_at
```

Example:

Customer buys 5 shirts:

```txt
3 from Stock Layer 1 at $2.13
2 from Stock Layer 2 at $2.23
```

Record:

| Sale Item | Stock Layer | Qty | Unit Cost |
|---|---:|---:|---:|
| Sale Item #1 | Layer 1 | 3 | $2.13 |
| Sale Item #1 | Layer 2 | 2 | $2.23 |

This answers:

- Which stock batch was sold?
- How many from each batch?
- Exact COGS?
- Exact profit?

---

## 13. Sale Create Logic

All sale creation must run inside a database transaction.

Pseudo logic:

```txt
BEGIN TRANSACTION

1. Create sales row
2. For each sale item:
   a. Create sale_items row
   b. Get FIFO stock_layers with remaining_qty > 0
   c. Lock rows for update
   d. Deduct from stock_layers.remaining_qty
   e. Create sale_item_cost_layers
   f. Create stock_movements with negative qty
   g. Update stock_balances
   h. Calculate cogs_usd and profit_usd
3. Update sale totals

COMMIT
```

If any step fails:

```txt
ROLLBACK
```

Important:

- Use row locking when deducting stock.
- Do not allow negative stock.
- Keep full money precision internally.

Laravel important concept:

```php
DB::transaction(function () {
    // create sale
    // deduct FIFO stock
    // create stock movement
    // update stock balance
});
```

When selecting stock layers:

```php
->lockForUpdate()
```

---

## 14. Sale Cancel / Edit / Return / Exchange

### Do Not Hard Delete Completed Sales

Completed sales should not be hard-deleted.

Use:

- cancel
- return
- exchange
- correction
- audit log

### Cancel Sale

When cancelling a sale:

```txt
1. sale.order_status = cancelled
2. Restore stock_layers.remaining_qty based on sale_item_cost_layers
3. Create stock_movements type = cancel_sale, qty_change = positive
4. Update stock_balances
5. Save cancellation reason
```

### `sale_cancellations`

```sql
id
sale_id
reason
cancelled_by
cancelled_at
created_at
updated_at
```

### Edit Sale

Before daily close, the UI may allow editing, but internally it should reverse and re-apply.

For edit:

```txt
1. Reverse old sale stock movements
2. Restore old FIFO stock layer quantities
3. Create new sale items/movements
4. Save edit history/audit log
```

After daily close:

```txt
Do not allow normal sale edit.
Only allow return, exchange, or owner correction.
```

### Sale Return

### `sale_returns`

```sql
id
sale_id
return_date
reason
refund_amount_usd
created_by
created_at
updated_at
```

### `sale_return_items`

```sql
id
sale_return_id
sale_item_id
product_variant_id
qty
unit_price_usd
return_to_stock
condition
created_at
updated_at
```

Recommended `condition`:

```txt
good
damaged
missing
cannot_resell
```

If product is good:

```txt
stock movement = sale_return +qty
```

If damaged:

```txt
do not return to sellable stock
record damaged/loss movement if needed
```

### Exchange

Example:

Customer changes Blue XL to Black 2XL.

```txt
Blue XL   = exchange_in +1
Black 2XL = exchange_out -1
```

Treat exchange as a linked return + new sale movement.

---

## 15. Customer Delivery Tracking

Customer delivery is separate from purchase delivery.

### `orders_delivery`

```sql
id
sale_id
delivery_company nullable
tracking_no nullable
customer_delivery_fee_usd
actual_delivery_cost_usd
delivery_profit_usd
delivery_status
delivered_at nullable
failed_reason nullable
note nullable
created_at
updated_at
```

Recommended `delivery_status`:

```txt
pending
packed
picked_up
delivering
delivered
failed
returned
cancelled
```

Delivery profit:

```txt
delivery_profit = customer_delivery_fee - actual_delivery_cost
```

Net order profit before general expenses:

```txt
product_profit + delivery_profit - discount
```

---

## 16. Packaging Tracking

Packaging status helps prevent packing mistakes.

### `packaging_logs`

```sql
id
sale_id
status
packed_by nullable
packed_at nullable
checked_by nullable
checked_at nullable
note nullable
created_at
updated_at
```

Recommended `status`:

```txt
waiting
packing
packed
checked
handover_to_delivery
```

Packaging checklist in UI should show:

- Customer name
- Customer phone
- Customer location
- Product style
- Size
- Quantity
- Payment status
- Delivery company
- Invoice/order number

---

## 17. Expense Tracking

### `expenses`

```sql
id
expense_date
category
amount_usd
amount_khr
currency
exchange_rate
note nullable
created_by
created_at
updated_at
```

Recommended categories:

```txt
ads
delivery
packaging
staff
rent
transport
phone
internet
other
```

Profit formulas:

```txt
Gross profit = net sales - COGS
Net profit = gross profit - expenses
```

---

## 18. Daily Closing

Wife/shop owner should close report daily.

### `daily_closings`

```sql
id
closing_date unique
total_orders
completed_orders
cancelled_orders
returned_orders
total_qty_sold
gross_sales_usd
discount_usd
net_sales_usd
total_cogs_usd
gross_profit_usd
total_expenses_usd
net_profit_usd
cash_usd
cash_khr
bank_usd
unpaid_usd
refund_usd
closed_by
closed_at
status
note nullable
created_at
updated_at
```

Daily report should show:

- Total orders
- Completed orders
- Cancelled orders
- Returned orders
- Total shirts sold
- Gross sales
- Discount
- Net sales
- Total COGS
- Gross profit
- Expenses
- Net profit
- Top selling shirt
- Top profitable shirt
- Low stock shirt
- Returned shirt
- Cancelled shirt
- Packed orders
- Delivered orders
- Failed delivery
- Cash USD
- Cash KHR
- ABA/bank amount
- Unpaid
- Refund

After daily close:

```txt
Lock that day from normal editing.
```

Only allow:

- return
- exchange
- stock adjustment
- owner correction

---

## 19. Monthly Report

Monthly report should include:

- Total revenue
- Total COGS
- Gross profit
- Total expenses
- Net profit
- Total shirts sold
- Top selling product
- Most profitable product
- Worst selling product
- Stock loss
- Return rate
- Cancel rate
- Delivery failed rate
- Remaining stock value

Stock value formula:

```txt
remaining_qty × FIFO unit_cost
```

Example:

```txt
Stock Layer 1: 20 pcs × $2.13 = $42.60
Stock Layer 2: 100 pcs × $2.23 = $223.00

Total stock value = $265.60
```

Monthly reports can be calculated from transactions, or optionally snapshotted later for performance.

---

## 20. Real Stock vs System Stock

The system needs stock counting and stock adjustment.

### `stock_counts`

```sql
id
count_date
status
counted_by
note nullable
created_at
updated_at
```

Recommended `status`:

```txt
draft
submitted
approved
adjusted
cancelled
```

### `stock_count_items`

```sql
id
stock_count_id
product_variant_id
system_qty
actual_qty
difference_qty
note nullable
created_at
updated_at
```

Example:

```txt
System stock = 50
Real stock = 48
Difference = -2
```

After owner approves:

```txt
stock movement = adjustment_out -2
reason = missing stock
```

This makes system stock match real outside stock.

Recommended stock count rhythm:

```txt
Fast-selling products: daily or every few days
Whole shop: weekly or monthly
```

---

## 21. Stock Adjustments

### `stock_adjustments`

```sql
id
adjustment_date
reason
note nullable
created_by
approved_by nullable
approved_at nullable
created_at
updated_at
```

### `stock_adjustment_items`

```sql
id
stock_adjustment_id
product_variant_id
system_qty
actual_qty
difference_qty
movement_type
note nullable
created_at
updated_at
```

Recommended `movement_type`:

```txt
adjustment_in
adjustment_out
missing
damaged
correction
```

Each approved adjustment creates a `stock_movements` row.

---

## 22. Audit Logs

Use audit logs to track important changes.

### `audit_logs`

```sql
id
user_id nullable
action
table_name
record_id
old_values json nullable
new_values json nullable
ip_address nullable
user_agent nullable
created_at
```

Track:

- sale edit
- sale cancel
- sale return
- stock adjustment
- product price change
- purchase edit
- daily closing correction

This helps answer:

- Who edited?
- What changed?
- When changed?
- Why changed?

---

## 23. Recommended Database Tables Summary

Core master data:

```txt
categories
products
product_variants
suppliers
users
```

Purchase/inventory:

```txt
purchases
purchase_items
stock_layers
stock_movements
stock_balances
```

Sales:

```txt
sales
sale_items
sale_item_cost_layers
sale_cancellations
sale_returns
sale_return_items
```

Operations:

```txt
orders_delivery
packaging_logs
expenses
```

Reports/control:

```txt
daily_closings
stock_counts
stock_count_items
stock_adjustments
stock_adjustment_items
audit_logs
```

---

## 24. Key Relationships

```txt
categories 1---many products
products 1---many product_variants

purchases 1---many purchase_items
purchase_items 1---1/many stock_layers
product_variants 1---many stock_layers

product_variants 1---many stock_movements
stock_layers 1---many stock_movements

sales 1---many sale_items
sale_items 1---many sale_item_cost_layers
stock_layers 1---many sale_item_cost_layers

sales 1---many sale_returns
sale_returns 1---many sale_return_items

sales 1---1 orders_delivery
sales 1---many packaging_logs

stock_counts 1---many stock_count_items
stock_adjustments 1---many stock_adjustment_items
```

---

## 25. Critical Implementation Rules

1. **Never directly update product qty as source of truth**
   - Use `stock_movements`.
   - `stock_balances` is only cache.

2. **Use FIFO**
   - Use `stock_layers`.
   - Deduct oldest layer first.

3. **Use landed cost**
   - Product purchase cost + purchase delivery/import/other purchase cost.

4. **Do not mix purchase delivery and customer delivery**
   - Purchase delivery goes into landed cost.
   - Customer delivery is order-level income/cost.

5. **Do not hard-delete completed sales**
   - Use cancel/return/exchange/correction.

6. **Store sale item cost/profit at sale time**
   - Old profit must not change when product cost changes later.

7. **Use database transactions**
   - Purchase save
   - Sale create
   - Sale cancel
   - Return
   - Exchange
   - Stock adjustment

8. **Use row locking**
   - When deducting stock layers for sale.

9. **Do not allow negative stock**
   - Unless explicitly enabled by owner. Default should be no negative stock.

10. **Lock daily closing**
    - After close, no normal edit for that day.

11. **Keep audit logs**
    - Track all sensitive changes.

12. **Keep precision**
    - Use decimal fields for money and quantities.
    - Round only for display.

---

## 26. Example Sale Flow

Current stock layers:

| Layer | Variant | Remaining Qty | Cost |
|---|---|---:|---:|
| 1 | Hawai Blue XL | 3 | $2.13 |
| 2 | Hawai Blue XL | 100 | $2.23 |

Customer buys 5 Hawai Blue XL at $6.50 each.

FIFO result:

```txt
3 pcs from Layer 1 = 3 × $2.13 = $6.39
2 pcs from Layer 2 = 2 × $2.23 = $4.46
Total COGS = $10.85
```

Sale:

```txt
Sale total = 5 × $6.50 = $32.50
Profit = $32.50 - $10.85 = $21.65
```

Records created:

```txt
sales
sale_items
sale_item_cost_layers:
  - layer 1, qty 3, unit cost 2.13
  - layer 2, qty 2, unit cost 2.23
stock_movements:
  - layer 1, sale -3
  - layer 2, sale -2
stock_balances updated
```

Now the system knows exactly which stock was sold.

---

## 27. Example Purchase Flow

Purchase shipment:

```txt
Delivery cost = $30
Other cost = $5
Total extra = $35
```

Items:

```txt
Hawai Blue M      qty 20 cost $2.03 sale $6
Hawai Blue L      qty 30 cost $2.03 sale $6
Premium Black XL  qty 25 cost $3.20 sale $8
Korean White M    qty 10 cost $6.50 sale $15
Korean White L    qty 10 cost $6.50 sale $15
```

Total qty:

```txt
95
```

Extra per unit:

```txt
35 / 95 = 0.368421
```

System creates:

```txt
purchases row
5 purchase_items rows
5 stock_layers rows
5 stock_movements purchase +qty
stock_balances updated
```

Each purchase item has its own landed cost.

---

## 28. Recommended MVP Build Order

### Phase 1: Core POS and inventory

- Categories
- Products
- Product variants
- Purchase entry
- Purchase item by variant/size
- Landed cost by quantity
- Stock layers
- Stock movements
- Stock balances
- Sale create
- FIFO deduction
- Sale item cost layers
- Basic daily report

### Phase 2: Real shop operation

- Sale cancel
- Sale return
- Sale exchange
- Stock adjustment
- Expenses
- Customer delivery tracking
- Packaging tracking
- Daily closing lock

### Phase 3: Reports

- Daily close report
- Monthly report
- Top selling product
- Product profit report
- Category profit report
- Remaining stock value
- Stock loss report
- Delivery failed report

### Phase 4: Advanced control

- Audit logs
- Role/permission
- Barcode/SKU search
- Low stock alert
- Stock count session
- Export reports
- Multi-user support

---

## 29. UI Requirements

### Purchase Screen

Should support:

- Supplier
- Purchase date
- Currency/exchange rate
- Purchase delivery cost
- Other cost
- Allocation method: by quantity by default
- Multiple category/style/size rows
- Auto-calculate landed cost
- Preview before save

Recommended fast UI for size input:

```txt
Product: Hawai Blue
Category: Shirt $6
Cost: $2.03
Sale Price: $6

M: 20
L: 30
XL: 25
2XL: 10
3XL: 5
```

Internally this should create separate `purchase_items` per size.

### Sale Screen

Should support:

- Search by SKU/product/name/barcode
- Add variant quickly
- Show available stock
- Show sale price
- Allow discount if needed
- Create sale
- Deduct FIFO stock
- Print/save invoice
- Track delivery and packaging

### Daily Closing Screen

Should show:

- Sales total
- Total shirts sold
- Profit
- Expenses
- Net profit
- Cash USD/KHR
- Bank/ABA
- Unpaid
- Refund
- Cancelled/returned orders
- Top selling shirts
- Low stock
- Delivery status summary

---

## 30. Final Architecture Summary

The system should be built around this model:

```txt
Product Variant
    ↓
Purchase Item
    ↓
Stock Layer FIFO
    ↓
Stock Movement Ledger
    ↓
Sale Item
    ↓
Sale Item Cost Layer
    ↓
Daily / Monthly Report
```

Final core rule:

```txt
Every stock change = stock movement
Every purchase item = FIFO stock layer
Every sale = exact FIFO cost
Every correction = audit/history record
Every day = closing report
```

This design is optimized for accurate stock, accurate profit/loss, purchase cost changes, delivery cost, cancellation, return, exchange, packaging, and daily/monthly reports.
