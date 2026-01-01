# Troubleshooting Guide

## Common Issues and Solutions

---

## Issue 1: Average Cost is Too High

### Symptoms
- Product average cost much higher than expected
- COGS eating into profit margins
- Inventory valuation seems inflated

### Possible Causes

#### A. Receiving in Wrong UOM (BEFORE FIX - 2025-11-21)

**Problem:**
```
Received: 1 case @ ₱140/case
Stored: 12 bottles @ ₱140/bottle ❌ (should be ₱11.67/bottle)
```

**Solution:**
This bug has been fixed. If you're seeing this:
1. Check your system version (should be post-2025-11-21)
2. Review historical receipts before the fix
3. Consider adjusting historical data if needed

#### B. Wrong Conversion Factor

**Problem:**
```
Product configuration:
  Base UOM: bottles
  Alternate UOM: case
  Conversion Factor: 24 ❌ (actual is 12)

Result:
  ₱140 ÷ 24 = ₱5.83/bottle (too low)
  Should be: ₱140 ÷ 12 = ₱11.67/bottle
```

**Solution:**
1. Go to Product settings
2. Check alternate UOM conversion factors
3. Verify against actual packaging
4. Update incorrect factors
5. Adjust future receipts

#### C. Data Entry Error

**Problem:**
```
Should receive: 10 cases @ ₱140/case
Entered: 10 cases @ ₱1,400/case ❌ (extra zero)

Result: Average cost 10x higher than expected
```

**Solution:**
1. Review recent receiving vouchers
2. Check for outlier prices
3. Void incorrect receipt
4. Re-enter with correct price

### Diagnostic Steps

```sql
-- Find products with unusually high average costs
SELECT
  id,
  name,
  baseUOM,
  averageCostPrice,
  basePrice
FROM Product
WHERE averageCostPrice > (basePrice * 0.9)  -- Cost > 90% of selling price
ORDER BY averageCostPrice DESC;

-- Check recent batches for a product
SELECT
  batchNumber,
  quantity,
  unitCost,
  receivedDate,
  status
FROM InventoryBatch
WHERE productId = 'product-id-here'
  AND status = 'active'
ORDER BY receivedDate DESC;
```

---

## Issue 2: Average Cost is Zero

### Symptoms
- Product shows ₱0.00 average cost
- COGS calculation shows zero
- Profit appears artificially high

### Possible Causes

#### A. No Stock Received Yet

**Problem:**
```
New product created
No receipts yet
Average Cost: ₱0.00
```

**Solution:**
1. Create purchase order for product
2. Receive initial stock
3. Average cost will update automatically

#### B. All Batches Depleted

**Problem:**
```
All inventory sold
All batches status = 'depleted'
No active batches
Average Cost: ₱0.00
```

**Solution:**
- This is normal behavior
- Average cost resets when new stock is received
- Order more inventory

### Diagnostic Steps

```sql
-- Check if product has any batches
SELECT
  p.name,
  p.averageCostPrice,
  COUNT(ib.id) as total_batches,
  SUM(CASE WHEN ib.status = 'active' THEN 1 ELSE 0 END) as active_batches,
  SUM(CASE WHEN ib.status = 'active' THEN ib.quantity ELSE 0 END) as total_quantity
FROM Product p
LEFT JOIN InventoryBatch ib ON p.id = ib.productId
WHERE p.id = 'product-id-here'
GROUP BY p.id, p.name, p.averageCostPrice;
```

---

## Issue 3: COGS Doesn't Match Average Cost

### Symptoms
- Sale shows COGS different from average cost
- Profit calculations seem incorrect

### Possible Causes

#### A. UOM Not Converted

**Problem:**
```
Sale: 2 cases
Average Cost: ₱11.67/bottle
COGS shown: ₱23.34 ❌

Should be: 2 × 12 × ₱11.67 = ₱280.08
```

**Solution:**
- This should be automatic in the system
- Check if UOM conversion is working
- Verify conversion factor is set

#### B. Average Cost Changed Between Operations

**Problem:**
```
Step 1: Get average cost = ₱10/bottle
Step 2: Receive new stock (average becomes ₱11/bottle)
Step 3: Calculate COGS = ₱11/bottle (updated)

COGS doesn't match initial average
```

**Solution:**
- This is correct behavior
- COGS uses current average at time of calculation
- If concerned, process sales immediately after checking stock

### Diagnostic Steps

```sql
-- Compare COGS to average cost for recent sales
SELECT
  ps.receiptNumber,
  ps.createdAt,
  psi.productName,
  psi.quantity,
  psi.uom,
  psi.costOfGoodsSold,
  p.averageCostPrice as current_avg_cost,
  -- Calculate what COGS should be (in base UOM)
  CASE
    WHEN psi.uom = p.baseUOM THEN psi.quantity * p.averageCostPrice
    ELSE psi.quantity * p.averageCostPrice  -- Should include conversion
  END as expected_cogs,
  -- Variance
  ABS(psi.costOfGoodsSold - (psi.quantity * p.averageCostPrice)) as variance
FROM POSSale ps
JOIN POSSaleItem psi ON ps.id = psi.saleId
JOIN Product p ON psi.productId = p.id
WHERE ps.createdAt >= DATE('now', '-7 days')
  AND variance > 1.00  -- More than ₱1 variance
ORDER BY variance DESC;
```

---

## Issue 4: Cannot Sell Product (Insufficient Stock)

### Symptoms
- "Insufficient stock" error when selling
- Shows stock in system but can't sell

### Possible Causes

#### A. Stock in Different Warehouse

**Problem:**
```
Product has 100 bottles in Warehouse A
Trying to sell from Warehouse B (POS location)
```

**Solution:**
1. Check warehouse selection in POS
2. Transfer stock between warehouses
3. Or select correct warehouse

#### B. All Batches Expired

**Problem:**
```
50 bottles in stock
All batches status = 'expired'
No 'active' batches available
```

**Solution:**
1. Review expired batches
2. If still sellable, mark as 'active'
3. If not, write off expired stock
4. Order fresh inventory

#### C. Reserved/Allocated Stock

**Problem:**
```
100 bottles total stock
50 bottles allocated to sales order
Only 50 bottles available for POS
```

**Solution:**
- Check for pending sales orders
- Review stock allocations
- Adjust allocations if needed

### Diagnostic Steps

```sql
-- Check stock availability by warehouse
SELECT
  w.name as warehouse,
  p.name as product,
  SUM(ib.quantity) as total_qty,
  COUNT(ib.id) as batch_count,
  MIN(ib.expiryDate) as earliest_expiry
FROM Product p
JOIN InventoryBatch ib ON p.id = ib.productId
JOIN Warehouse w ON ib.warehouseId = w.id
WHERE p.id = 'product-id-here'
  AND ib.status = 'active'
GROUP BY w.id, w.name, p.id, p.name;
```

---

## Issue 5: Profit Margin Seems Wrong

### Symptoms
- Margin lower than expected
- Profit percentage doesn't match calculations

### Possible Causes

#### A. Recent Cost Increase

**Problem:**
```
Old average cost: ₱10/bottle
Received expensive batch: ₱15/bottle
New average cost: ₱12/bottle
Selling price unchanged: ₱13/bottle

Old margin: 23%
New margin: 8%
```

**Solution:**
1. Review recent receipts
2. Check supplier pricing
3. Adjust selling prices to maintain margin
4. Or negotiate better supplier prices

#### B. Discounts Applied

**Problem:**
```
Base price: ₱15/bottle
Discount: 20%
Actual price: ₱12/bottle
COGS: ₱11/bottle

Expected margin (no discount): 27%
Actual margin (with discount): 8%
```

**Solution:**
- This is correct
- Discounts reduce margin
- Monitor discount impact
- Set discount limits

### Diagnostic Steps

```sql
-- Find products with low margins
SELECT
  p.name,
  p.basePrice as selling_price,
  p.averageCostPrice as cost,
  (p.basePrice - p.averageCostPrice) as profit_per_unit,
  ROUND(((p.basePrice - p.averageCostPrice) / p.basePrice * 100), 2) as margin_pct
FROM Product p
WHERE p.averageCostPrice > 0
  AND ((p.basePrice - p.averageCostPrice) / p.basePrice * 100) < 20  -- Less than 20% margin
ORDER BY margin_pct ASC;
```

---

## Issue 6: Inventory Valuation Incorrect

### Symptoms
- Total inventory value seems too high/low
- Balance sheet doesn't balance
- Stock count correct but value wrong

### Possible Causes

#### A. Old Batches Not Expired

**Problem:**
```
Batch from 2 years ago
Still marked 'active'
Should be 'expired' or written off
```

**Solution:**
1. Run batch expiry check
2. Mark expired batches as 'expired'
3. Write off unusable stock
4. Adjust inventory valuation

#### B. Missing Cost Updates

**Problem:**
```
Some batches have ₱0 unit cost
Imported old data without costs
```

**Solution:**
1. Find zero-cost batches
2. Estimate historical costs
3. Update batch unit costs
4. Recalculate average costs

### Diagnostic Steps

```sql
-- Check inventory valuation
SELECT
  SUM(ib.quantity * ib.unitCost) as inventory_value,
  COUNT(DISTINCT ib.productId) as product_count,
  COUNT(ib.id) as batch_count
FROM InventoryBatch ib
WHERE ib.status = 'active';

-- Find batches with zero cost
SELECT
  p.name,
  ib.batchNumber,
  ib.quantity,
  ib.unitCost,
  ib.receivedDate
FROM InventoryBatch ib
JOIN Product p ON ib.productId = p.id
WHERE ib.status = 'active'
  AND (ib.unitCost = 0 OR ib.unitCost IS NULL)
ORDER BY ib.receivedDate;
```

---

## Issue 7: UOM Conversion Errors

### Symptoms
- Wrong quantities showing in reports
- Stock counts don't match physical inventory

### Possible Causes

#### A. Wrong Conversion Factor

**Problem:**
```
Config says: 1 case = 24 bottles
Actually: 1 case = 12 bottles

Receive 10 cases
System thinks: 240 bottles
Actually: 120 bottles
```

**Solution:**
1. Verify actual packaging
2. Update conversion factor
3. Review past receipts
4. Adjust stock counts if needed

#### B. Mixed Units

**Problem:**
```
Some suppliers use 12-bottle cases
Others use 24-bottle cases
Same "case" UOM for both
```

**Solution:**
1. Create separate UOMs
   - "case-12" for 12-bottle cases
   - "case-24" for 24-bottle cases
2. Update supplier POs accordingly
3. Train staff on correct UOM selection

### Diagnostic Steps

```sql
-- Review UOM configurations
SELECT
  p.name,
  p.baseUOM,
  pu.name as alternate_uom,
  pu.conversionFactor,
  pu.sellingPrice
FROM Product p
JOIN ProductUOM pu ON p.id = pu.productId
ORDER BY p.name, pu.conversionFactor;
```

---

## General Diagnostic Tools

### Check System Health

```sql
-- Products without stock
SELECT COUNT(*) as products_no_stock
FROM Product p
LEFT JOIN InventoryBatch ib ON p.id = ib.productId AND ib.status = 'active'
WHERE ib.id IS NULL
  AND p.status = 'active';

-- Products with high cost-to-price ratio (low margin)
SELECT COUNT(*) as low_margin_products
FROM Product
WHERE averageCostPrice > (basePrice * 0.8)  -- Cost > 80% of price
  AND status = 'active';

-- Expired but active batches
SELECT COUNT(*) as expired_active_batches
FROM InventoryBatch
WHERE status = 'active'
  AND expiryDate < DATE('now');

-- Recent large cost changes
SELECT
  p.name,
  p.averageCostPrice as current_cost,
  AVG(ib.unitCost) as avg_batch_cost,
  (p.averageCostPrice - AVG(ib.unitCost)) as cost_variance
FROM Product p
JOIN InventoryBatch ib ON p.id = ib.productId
WHERE ib.status = 'active'
  AND ib.receivedDate >= DATE('now', '-30 days')
GROUP BY p.id, p.name, p.averageCostPrice
HAVING ABS(cost_variance) > (p.averageCostPrice * 0.1)  -- More than 10% variance
ORDER BY ABS(cost_variance) DESC;
```

---

## Prevention Best Practices

### 1. Data Entry

✅ **Double-check prices** before saving receipts
✅ **Verify UOMs** match actual packaging
✅ **Count physical stock** accurately
✅ **Review conversion factors** periodically

### 2. Regular Audits

✅ **Weekly**: Review average costs for anomalies
✅ **Monthly**: Reconcile physical vs system stock
✅ **Quarterly**: Verify conversion factors
✅ **Yearly**: Audit historical cost data

### 3. Staff Training

✅ Train on **UOM importance**
✅ Explain **average cost concept**
✅ Practice **receiving procedures**
✅ Review **common mistakes**

### 4. System Monitoring

✅ Set up **alerts for zero costs**
✅ Monitor **margin drops**
✅ Track **cost trends**
✅ Review **daily COGS reports**

---

## Getting Help

If issue persists after troubleshooting:

1. **Document the problem**
   - Exact error messages
   - Steps to reproduce
   - Expected vs actual behavior
   - Relevant transaction IDs

2. **Gather data**
   - Product ID
   - Receipt numbers
   - Batch numbers
   - Screenshots

3. **Check logs**
   - Review system logs
   - Check API error logs
   - Look for validation errors

4. **Contact support**
   - Provide documentation
   - Share gathered data
   - Explain troubleshooting steps taken

---

## Quick Reference

| Issue | Quick Check | Quick Fix |
|-------|-------------|-----------|
| High avg cost | Check recent receipts, UOM conversions | Verify conversion factors |
| Zero avg cost | Check for active batches | Receive stock |
| Wrong COGS | Compare to avg cost × quantity | Check UOM conversion |
| Can't sell | Check warehouse, batch status | Transfer stock or mark active |
| Low margin | Check recent cost increases | Adjust prices |
| Wrong valuation | Check batch costs, expiry status | Mark expired batches |
| UOM errors | Verify conversion factors | Update factors, adjust stock |

---

## Next Steps

- [API Reference](./09-api-reference.md) - Technical implementation
- [Overview](./01-overview.md) - System architecture
- [Weighted Average Costing](./02-weighted-average-costing.md) - Method details

---

**Related Topics:**
- System Administration
- Data Quality Management
- Audit Procedures
- Staff Training
