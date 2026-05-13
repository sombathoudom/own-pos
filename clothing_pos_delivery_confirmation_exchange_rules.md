# Clothing Store POS System — Delivery Confirmation, Exchange, Partial Delivery, and Extra Item Rules

## 1. Purpose of This Document

This document extends the main POS implementation plan.

It focuses on the real-world delivery and exchange problems in the clothing store:

1. Customer keeps same order but changes size/style.
2. Customer changes size/style and also adds extra item.
3. Customer promised to take 4 shirts, but when delivery arrives, they take only 3, 2, 1, or cancel all.
4. Delivery fee may stay `$2`, become `$0`, or be manually changed based on the conversation with the customer.
5. Final sale total must be calculated from the actual accepted items, not only the original promised order.

This document should be used together with the existing core POS structure:

```txt
categories
products
product_variants

purchases
purchase_items

stock_layers
stock_movements
stock_balances

sales
sale_items
sale_item_cost_layers

orders_delivery
packaging_logs
expenses
daily_closings
stock_counts
stock_adjustments
audit_logs
```

---

## 2. Main Business Problem

In this business, many customers order shirts through chat/social media.

A customer may promise:

```txt
I will take 4 shirts.
```

The shop packs and sends 4 shirts.

But when delivery arrives, the customer may:

```txt
Take all 4 shirts
Take only 3 shirts
Take only 2 shirts
Take only 1 shirt
Change size/style
Add extra item
Cancel everything
```

Therefore, the POS must separate:

```txt
Original Order = what customer promised
Final Sale = what customer actually accepted/took
```

The final profit/loss report must use the final accepted sale.

---

## 3. Recommended Feature: Delivery Confirmation

Add a feature called:

```txt
Delivery Confirmation
```

This feature happens after the order is packed/out for delivery and before the sale is considered fully completed.

The delivery confirmation screen should allow the shop owner/wife to record what actually happened at delivery time.

Possible results:

```txt
Delivered all
Partially delivered
Changed item
Added item
Rejected item
Cancelled at door
Failed delivery
```

---

## 4. High-Level Order Flow

Recommended order flow:

```txt
1. Create order
2. Confirm order
3. Deduct/reserve stock
4. Pack order
5. Send delivery
6. Delivery confirmation
7. Finalize sale based on accepted items
8. Daily close report
```

For this shop, recommended stock behavior:

```txt
Confirmed order deducts stock immediately.
Rejected/cancelled items are added back into stock during delivery confirmation.
```

This is simpler than a reserved-stock system and matches the current business workflow.

---

## 5. Important Rule: Final Sale Uses Accepted Items

Reports should not use the original promised quantity if the customer did not take all items.

Use this rule:

```txt
Final sale qty = accepted qty
Final sale amount = accepted items total + final delivery fee - discount
Rejected qty = returned back to stock
```

Example:

Customer promised 4 shirts:

```txt
4 shirts × $6 = $24
Delivery fee = $2
Original total = $26
```

At delivery, customer takes only 2 shirts:

```txt
Accepted qty = 2
Rejected qty = 2
Final product total = 2 × $6 = $12
Final delivery fee = manually chosen, e.g. $2 or $0
Final total = $12 + final delivery fee
```

If final delivery fee is `$2`:

```txt
Final total = $12 + $2 = $14
```

If final delivery fee is `$0`:

```txt
Final total = $12 + $0 = $12
```

The rejected 2 shirts are added back to stock.

---

## 6. Delivery Fee Rule

Delivery fee must be flexible/manual.

The business currently uses something like:

```txt
Delivery fee = $2
```

But in real life, the fee may change based on the conversation with the customer.

Examples:

```txt
Customer changes size only -> delivery may stay $2
Customer adds extra item -> delivery may stay $2 or become $0 or another amount
Customer takes fewer shirts -> delivery may stay $2 or become $0
Customer cancels all -> delivery fee may be $0 or $2 depending on agreement
```

Therefore, do not hard-code delivery fee behavior.

Store:

```txt
original_delivery_fee_usd
final_delivery_fee_usd
delivery_fee_note
```

Recommended delivery fee mode:

```txt
manual
```

---

## 7. Case 1: Customer Keeps Same Order But Changes Size/Style

### Example

Original order:

```txt
Hawai Blue XL × 1
Delivery fee = $2
```

Customer changes to:

```txt
Hawai Black 2XL × 1
Delivery fee still = $2
```

### Business Meaning

This is not a full sale return.

This is:

```txt
Change Item / Change Size / Change Style
```

because delivery is not completed yet.

### Stock Movement

Old item goes back to stock:

```txt
Hawai Blue XL +1
```

New item is deducted:

```txt
Hawai Black 2XL -1
```

### Final Total

If both shirts have the same sale price:

```txt
Final total = new item sale price + final delivery fee
```

Example:

```txt
New item price = $6
Final delivery fee = $2

Final total = $6 + $2 = $8
```

If new shirt price is different:

```txt
Final total = new item sale price + final delivery fee
```

Example:

```txt
Old item price = $6
New item price = $8
Final delivery fee = $2

Final total = $8 + $2 = $10
```

---

## 8. Case 2: Customer Changes Size/Style and Adds Extra Item

### Example

Original order:

```txt
Hawai Blue XL × 2
Original delivery fee = $2
```

At delivery/customer chat, customer changes one item and adds one extra shirt:

```txt
Hawai Blue XL × 1 accepted
Hawai Black 2XL × 1 changed/accepted
Premium Flower L × 1 added
```

### Business Meaning

This should be handled inside:

```txt
Delivery Confirmation
```

Actions:

```txt
Old changed/rejected item returns to stock
New changed item deducts stock
Extra added item deducts stock
Final total recalculates using all accepted/new items
Final delivery fee is manually chosen
```

### Important Calculation Rule

When customer adds an extra item, the system must add the new product sale price to the final total.

Formula:

```txt
Final product total =
sum(accepted original items)
+ sum(changed/new replacement items)
+ sum(added extra items)
```

Then:

```txt
Final total =
Final product total
+ final_delivery_fee_usd
- discount_usd
```

### Example A: Extra item added, delivery stays $2

Original:

```txt
2 shirts × $6 = $12
Delivery fee = $2
Original total = $14
```

Customer changes/adds:

```txt
Accepted original item: 1 × $6 = $6
Changed item: 1 × $6 = $6
Added extra item: 1 × $8 = $8
Final delivery fee = $2
```

Final product total:

```txt
$6 + $6 + $8 = $20
```

Final total:

```txt
$20 + $2 = $22
```

### Example B: Extra item added, delivery becomes $0

Same items:

```txt
Accepted original item: 1 × $6 = $6
Changed item: 1 × $6 = $6
Added extra item: 1 × $8 = $8
Final delivery fee = $0
```

Final product total:

```txt
$6 + $6 + $8 = $20
```

Final total:

```txt
$20 + $0 = $20
```

### Example C: Extra item added, delivery manually changed to $4

```txt
Final product total = $20
Final delivery fee = $4
Final total = $24
```

The POS should allow this because delivery fee depends on customer conversation.

---

## 9. Case 3: Customer Promised 4 Shirts But Takes Only Some

### Example

Original order:

```txt
Hawai Blue XL × 4
Unit price = $6
Original delivery fee = $2
Original product total = $24
Original total = $26
```

At delivery, customer takes only 3.

### Final Calculation

```txt
Accepted qty = 3
Rejected qty = 1
Final product total = 3 × $6 = $18
```

If final delivery fee is `$2`:

```txt
Final total = $18 + $2 = $20
```

If final delivery fee is `$0`:

```txt
Final total = $18 + $0 = $18
```

Rejected stock:

```txt
Rejected 1 shirt returns to stock.
```

### If customer takes only 2

```txt
Accepted qty = 2
Rejected qty = 2
Final product total = 2 × $6 = $12
```

With `$2` delivery:

```txt
Final total = $12 + $2 = $14
```

With `$0` delivery:

```txt
Final total = $12
```

### If customer takes only 1

```txt
Accepted qty = 1
Rejected qty = 3
Final product total = 1 × $6 = $6
```

With `$2` delivery:

```txt
Final total = $6 + $2 = $8
```

With `$0` delivery:

```txt
Final total = $6
```

### If customer cancels all

```txt
Accepted qty = 0
Rejected qty = 4
Final product total = $0
```

Final delivery fee is manual:

```txt
Could be $0
Could be $2
Could be another agreed amount
```

If delivery fee is `$0`:

```txt
Final total = $0
```

If delivery fee is `$2`:

```txt
Final total = $2
```

All 4 shirts return to stock.

Sale status should be:

```txt
delivery_cancelled
```

or:

```txt
cancelled_at_door
```

---

## 10. Difference Between Change, Exchange, Return, and Delivery Confirmation

Use these meanings:

### Change Item

Used before delivery is completed.

Example:

```txt
Customer changes size/style before accepting final delivery.
```

Stock:

```txt
Old item +stock
New item -stock
```

### Add Item

Used before delivery is completed or during delivery confirmation.

Example:

```txt
Customer adds one more shirt.
```

Stock:

```txt
Added item -stock
```

Final total must include the new item sale price.

### Partial Delivery

Used when customer promised more but accepts fewer.

Example:

```txt
Promised 4, accepted 2, rejected 2.
```

Stock:

```txt
Accepted items remain sold
Rejected items +stock
```

### Cancelled at Door

Used when customer accepts nothing.

Stock:

```txt
All sent items +stock
```

### Exchange

Used after delivery is already completed.

Example:

```txt
Customer already received shirt yesterday, then wants to change size today.
```

Stock:

```txt
Returned old item +stock
New item -stock
```

### Sale Return

Used after completed delivery when customer gives item back and does not take a new item.

Stock:

```txt
Returned item +stock if sellable
```

Refund may be recorded.

---

## 11. Database Additions

Keep the existing POS tables, but add delivery confirmation tables.

### `delivery_confirmations`

```sql
id
sale_id
confirmation_date
original_product_total_usd
final_product_total_usd
original_delivery_fee_usd
final_delivery_fee_usd
discount_usd
final_total_usd
delivery_fee_note
status
note
confirmed_by
created_at
updated_at
```

Recommended `status` values:

```txt
delivered
partially_delivered
changed_items
added_items
cancelled_at_door
failed_delivery
```

### `delivery_confirmation_items`

```sql
id
delivery_confirmation_id
sale_item_id nullable
original_product_variant_id nullable
final_product_variant_id nullable
original_qty
accepted_qty
rejected_qty
added_qty
unit_price_usd
final_total_usd
action_type
return_to_stock
condition
note
created_at
updated_at
```

Recommended `action_type` values:

```txt
accepted
partially_accepted
rejected
changed
added
removed
cancelled
```

Recommended `condition` values:

```txt
good
damaged
missing
cannot_resell
```

---

## 12. Sale Item Status

Add status to `sale_items`.

### Update `sale_items`

```sql
status
accepted_qty
rejected_qty
final_qty
```

Recommended `status` values:

```txt
pending
packed
accepted
partially_accepted
rejected
changed
returned
cancelled
```

This is needed because one order can have multiple items and each item may have different result.

Example:

```txt
Order has 4 shirts.
2 accepted.
1 changed.
1 rejected.
```

---

## 13. Sales Table Final Fields

Update or support these fields in `sales`:

```sql
original_subtotal_usd
final_subtotal_usd
original_delivery_fee_usd
final_delivery_fee_usd
discount_usd
final_total_usd
final_cogs_usd
final_profit_usd
order_status
```

The original values preserve what customer first promised.

The final values represent what actually happened.

---

## 14. Stock Movement Types for Delivery Confirmation

Add these movement types:

```txt
delivery_rejected_return
delivery_change_in
delivery_change_out
delivery_added_item
delivery_cancel_return
```

Examples:

### Partial delivery

Customer promised 4, accepted 2, rejected 2:

```txt
delivery_rejected_return +2
```

### Change item

Old item:

```txt
delivery_change_in +1
```

New item:

```txt
delivery_change_out -1
```

### Add extra item

```txt
delivery_added_item -1
```

### Cancel all at door

```txt
delivery_cancel_return +all_qty
```

---

## 15. FIFO Rule for Delivery Confirmation

When the order was first confirmed, the system already deducted stock using FIFO and created `sale_item_cost_layers`.

When items are rejected, cancelled, or changed, restore stock to the original stock layers from `sale_item_cost_layers`.

Recommended rule:

```txt
Restore rejected/cancelled/change-in quantities back to the same stock layers originally used by the sale.
```

This keeps stock cost and inventory value accurate.

For added/new items, deduct from FIFO like a normal sale.

---

## 16. Profit Rule

Profit should be calculated from final accepted items.

### Product profit

```txt
product_profit = final_product_total - final_COGS
```

### Delivery profit

```txt
delivery_profit = final_delivery_fee_usd - actual_delivery_cost_usd
```

### Final order profit before general expenses

```txt
final_order_profit =
product_profit
+ delivery_profit
- discount_usd
```

General expenses like ads, rent, salary, and packaging are handled in `expenses`.

---

## 17. Case 2 Profit Example: Add Extra Item

Original order:

```txt
2 shirts × $6 = $12
Original delivery fee = $2
Original total = $14
```

At delivery:

```txt
Accepted original item: 1 × $6 = $6
Changed replacement item: 1 × $6 = $6
Added extra item: 1 × $8 = $8
Final delivery fee = $2 or $0
```

Final product total:

```txt
$6 + $6 + $8 = $20
```

If final delivery fee = `$2`:

```txt
Final total = $22
```

If final delivery fee = `$0`:

```txt
Final total = $20
```

Cost example:

```txt
Accepted original item COGS = $2.40
Changed replacement item COGS = $2.40
Added item COGS = $3.60
Final COGS = $8.40
```

Product profit:

```txt
$20 - $8.40 = $11.60
```

If delivery fee = `$2` and actual delivery cost = `$2`:

```txt
Delivery profit = $2 - $2 = $0
Final order profit = $11.60
```

If delivery fee = `$0` and actual delivery cost = `$2`:

```txt
Delivery profit = $0 - $2 = -$2
Final order profit = $11.60 - $2 = $9.60
```

This is why delivery fee must be tracked separately from product profit.

---

## 18. UI Recommendation for Delivery Confirmation

On sale/order detail, add a button:

```txt
Confirm Delivery
```

The screen should show:

```txt
Original Order
- Product
- Size
- Qty
- Price
- Delivery fee
- Original total

Final Delivery
- Accepted qty
- Rejected qty
- Changed item
- Added item
- Final delivery fee
- Discount
- Final total preview
```

Buttons/actions:

```txt
Delivered All
Partial Delivered
Change Size/Style
Add Extra Item
Cancel at Door
Failed Delivery
```

For each item row, allow:

```txt
Accepted qty
Rejected qty
Change to another variant
Add another product
Condition of returned/rejected item
```

Delivery fee input:

```txt
Final delivery fee: manual input
Default: original delivery fee, e.g. $2
Can change to $0, $2, $4, etc.
```

---

## 19. Daily Report Impact

Daily report should count final accepted items only.

If customer promised 4 but accepted 2:

```txt
Sold qty = 2
Rejected qty = 2
Revenue = accepted items total + final delivery fee
COGS = COGS for accepted items only
Profit = final profit
```

Report should include:

```txt
Total promised qty
Total accepted qty
Total rejected qty
Cancelled at door count
Partial delivery count
Added item count
Changed item count
Delivery fee collected
Actual delivery cost
Delivery profit/loss
```

---

## 20. Monthly Report Impact

Monthly report should include:

```txt
Total accepted sold qty
Total rejected qty
Total cancelled-at-door qty
Total added item qty
Total changed item qty
Delivery profit/loss
Product profit
Net profit
Return/exchange after completed
Stock loss/adjustment
```

This helps the owner understand real delivery performance.

---

## 21. Important Implementation Rules

1. Do not treat every customer change as a sale return.
2. Use delivery confirmation before order is completed.
3. Use exchange only after delivery is already completed.
4. Use sale return only when customer returns after completed and does not take another item.
5. Final sale total must include extra added product sale price.
6. Final delivery fee must be manual/flexible.
7. Rejected items must return to stock.
8. Added items must deduct stock using FIFO.
9. Changed item must return old item to stock and deduct new item.
10. Daily/monthly reports must use final accepted items, not original promised items.
11. Use audit logs for all delivery confirmation changes.
12. Use database transactions for delivery confirmation.
13. Restore rejected items to original FIFO stock layers from `sale_item_cost_layers`.
14. Deduct added items from FIFO stock layers like normal sale.
15. Keep original order values and final order values separately.

---

## 22. Recommended Transaction Logic for Delivery Confirmation

Pseudo flow:

```txt
BEGIN TRANSACTION

1. Load sale and sale_items
2. Create delivery_confirmations row
3. For each item:
   a. Record accepted_qty and rejected_qty
   b. If rejected_qty > 0:
      - Restore stock to original sale_item_cost_layers
      - Create stock_movement delivery_rejected_return +qty
   c. If changed:
      - Restore old item to original layer
      - Deduct new item using FIFO
      - Create delivery_change_in and delivery_change_out movements
   d. If added:
      - Deduct added item using FIFO
      - Create stock_movement delivery_added_item -qty
      - Create sale_item or linked delivery_confirmation_item for added item
4. Recalculate final product total
5. Apply final delivery fee
6. Apply discount if any
7. Recalculate final COGS
8. Recalculate final profit
9. Update sale final fields and order_status
10. Update stock_balances
11. Create audit log

COMMIT
```

If any step fails:

```txt
ROLLBACK
```

---

## 23. Final Summary

The correct structure for this real business flow is:

```txt
Original order = customer promise
Delivery confirmation = what actually happened
Final sale = accepted items + final delivery fee
```

Use:

```txt
Change Item
Add Item
Partial Delivery
Cancelled at Door
Exchange
Sale Return
```

Correct usage:

```txt
Before completed:
- Change Item
- Add Item
- Partial Delivery
- Cancelled at Door

After completed:
- Exchange
- Sale Return
```

Final total formula:

```txt
final_total_usd =
final_product_total_usd
+ final_delivery_fee_usd
- discount_usd
```

Where:

```txt
final_product_total_usd =
accepted original items
+ changed/new replacement items
+ added extra items
```

This solves:

```txt
Customer changed size/style
Customer added extra item
Delivery fee changed to $2 or $0
Customer promised 4 but accepted fewer
Customer cancelled at door
Rejected stock returning correctly
Profit/loss calculated from final accepted sale
Daily/monthly reports showing real business result
```
