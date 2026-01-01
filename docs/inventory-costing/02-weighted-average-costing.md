# Weighted Average Costing Method

## What is Weighted Average Costing?

Weighted Average Costing is an inventory valuation method where the average cost of all units in inventory is recalculated each time new stock is received. This average cost is then used to calculate Cost of Goods Sold (COGS) when items are sold.

---

## Formula

```
Weighted Average Cost = Total Value of Inventory / Total Quantity in Inventory
```

Where:
- **Total Value** = Sum of (Quantity × Unit Cost) for all active batches
- **Total Quantity** = Sum of quantities across all active batches

---

## How It Works in InventoryPro

### 1. Initial State (No Stock)

```
Product: Coca-Cola 500ml
Base UOM: bottles
Current Stock: 0 bottles
Average Cost: ₱0.00/bottle
```

### 2. First Receipt

```
Receive: 100 bottles @ ₱10/bottle

Calculation:
  Total Value = ₱10 × 100 = ₱1,000
  Total Quantity = 100 bottles
  Average Cost = ₱1,000 / 100 = ₱10.00/bottle

Updated Product:
  Stock: 100 bottles
  Average Cost: ₱10.00/bottle
```

### 3. Second Receipt (Same Price)

```
Receive: 50 bottles @ ₱10/bottle

Calculation:
  Previous Value = ₱10 × 100 = ₱1,000
  New Value = ₱10 × 50 = ₱500
  Total Value = ₱1,500
  Total Quantity = 150 bottles
  Average Cost = ₱1,500 / 150 = ₱10.00/bottle

Updated Product:
  Stock: 150 bottles
  Average Cost: ₱10.00/bottle (unchanged)
```

### 4. Third Receipt (Different Price)

```
Receive: 50 bottles @ ₱12/bottle

Calculation:
  Previous Value = ₱10 × 150 = ₱1,500
  New Value = ₱12 × 50 = ₱600
  Total Value = ₱2,100
  Total Quantity = 200 bottles
  Average Cost = ₱2,100 / 200 = ₱10.50/bottle

Updated Product:
  Stock: 200 bottles
  Average Cost: ₱10.50/bottle (increased)
```

### 5. Sale (COGS Calculation)

```
Sell: 50 bottles @ ₱15/bottle (selling price)

COGS Calculation:
  Average Cost: ₱10.50/bottle
  Quantity Sold: 50 bottles
  COGS = ₱10.50 × 50 = ₱525

Financial Impact:
  Revenue: ₱15 × 50 = ₱750
  COGS: ₱525
  Gross Profit: ₱750 - ₱525 = ₱225
  Margin: 30%

Updated Product:
  Stock: 150 bottles
  Average Cost: ₱10.50/bottle (unchanged by sales)
```

---

## Detailed Calculation Example

### Scenario: Multiple Receipts with Price Changes

```
Product: Water 1L
Base UOM: bottles
Initial Stock: 0

Receipt 1:
  Date: Jan 1
  Quantity: 100 bottles @ ₱8/bottle
  Batch Value: ₱800

  Average = ₱800 / 100 = ₱8.00/bottle

Receipt 2:
  Date: Jan 5
  Quantity: 200 bottles @ ₱9/bottle
  Batch Value: ₱1,800

  Total Value = ₱800 + ₱1,800 = ₱2,600
  Total Qty = 100 + 200 = 300
  Average = ₱2,600 / 300 = ₱8.67/bottle

Receipt 3:
  Date: Jan 10
  Quantity: 150 bottles @ ₱7/bottle
  Batch Value: ₱1,050

  Total Value = ₱2,600 + ₱1,050 = ₱3,650
  Total Qty = 300 + 150 = 450
  Average = ₱3,650 / 450 = ₱8.11/bottle

Sale 1:
  Date: Jan 12
  Sell: 200 bottles @ ₱12/bottle
  COGS = ₱8.11 × 200 = ₱1,622
  Revenue = ₱12 × 200 = ₱2,400
  Profit = ₱778

  Remaining: 250 bottles @ ₱8.11/bottle (average unchanged)
```

---

## Code Implementation

### File: `services/inventory.service.ts`

```typescript
/**
 * Calculate weighted average cost for a product in a warehouse
 * Formula: (sum of quantity × unitCost) / (sum of quantity)
 */
async calculateWeightedAverageCost(
  productId: string,
  warehouseId: string
): Promise<number> {
  const batches = await inventoryRepository.findActiveBatches(productId, warehouseId);

  if (batches.length === 0) {
    return 0;
  }

  const totalCost = batches.reduce(
    (sum, batch) => sum + Number(batch.quantity) * Number(batch.unitCost),
    0
  );

  const totalQuantity = batches.reduce(
    (sum, batch) => sum + Number(batch.quantity),
    0
  );

  return totalQuantity > 0 ? totalCost / totalQuantity : 0;
}
```

### File: `services/receiving-voucher.service.ts`

```typescript
// Update product's weighted average cost price
const currentBatches = await tx.inventoryBatch.findMany({
  where: {
    productId: item.productId,
    status: 'active',
  },
});

const currentTotalStock = currentBatches.reduce(
  (sum, b) => sum + Number(b.quantity),
  0
);
const currentAvgCost = Number(currentProduct.averageCostPrice || 0);
const newCost = Number(unitCostInBaseUOM);
const newQty = Number(item.receivedQuantity);

// Calculate new weighted average cost
const totalValue = (currentAvgCost * currentTotalStock) + (newCost * newQty);
const totalQty = currentTotalStock + newQty;
const newAvgCost = totalQty > 0 ? totalValue / totalQty : newCost;

// Update product's average cost price
await tx.product.update({
  where: { id: item.productId },
  data: {
    averageCostPrice: Number(newAvgCost.toFixed(2)),
  },
});
```

---

## Advantages of Weighted Average

### 1. Smooths Price Fluctuations
- Reduces impact of volatile supplier prices
- Provides stable cost base for pricing decisions
- Evens out seasonal price variations

### 2. Simpler Than FIFO/LIFO
- No need to track which specific units were sold
- Easier to implement and maintain
- Less complex than specific identification

### 3. Better for Homogeneous Products
- Ideal for products where units are interchangeable
- Suitable for bulk commodities
- Works well for beverages, packaged goods, etc.

### 4. Tax and Accounting Benefits
- Acceptable under GAAP and IFRS
- Provides middle ground between FIFO and LIFO
- Easier to audit and explain

---

## When Average Cost Updates

The weighted average cost is recalculated and updated:

✅ **When stock is received** (Receiving Voucher)
✅ **When stock is transferred** between warehouses
❌ **NOT when stock is sold** (sales don't affect average)
❌ **NOT when batches expire** (only active batches count)

---

## Comparison with Other Methods

### FIFO (First In, First Out)
- **Physical Flow**: Uses oldest cost for COGS
- **Effect**: Higher profits during inflation
- **Complexity**: Must track batch order

### LIFO (Last In, First Out)
- **Physical Flow**: Uses newest cost for COGS
- **Effect**: Lower profits during inflation
- **Complexity**: Must track batch order
- **Note**: Not allowed under IFRS

### Weighted Average
- **Physical Flow**: Uses average cost for COGS
- **Effect**: Moderate profits, smoothed
- **Complexity**: Simple calculation
- **Note**: Our system combines weighted average costing with FIFO physical movement

---

## Real-World Example

### Grocery Store Scenario

```
Product: Fresh Milk 1L
Base UOM: liters

Week 1: Supplier A delivers 500L @ ₱45/L
  Average Cost: ₱45/L

Week 2: Supplier B delivers 300L @ ₱50/L (price increase!)
  New Average: ((₱45×500) + (₱50×300)) / 800 = ₱46.88/L

Week 3: Sell 400L @ ₱65/L retail
  COGS: ₱46.88 × 400 = ₱18,752
  Revenue: ₱65 × 400 = ₱26,000
  Gross Profit: ₱7,248 (27.9% margin)

Week 4: Supplier A delivers 600L @ ₱43/L (price drop!)
  New Average: ((₱46.88×400) + (₱43×600)) / 1000 = ₱44.35/L

Week 5: Sell 500L @ ₱65/L retail
  COGS: ₱44.35 × 500 = ₱22,175
  Revenue: ₱65 × 500 = ₱32,500
  Gross Profit: ₱10,325 (31.8% margin)
```

**Observation**: The weighted average method provided stable, predictable costing despite supplier price fluctuations of ₱43-50/L.

---

## Best Practices

1. **Receive regularly** to keep average current
2. **Review average costs** monthly for anomalies
3. **Monitor price trends** vs. average
4. **Adjust selling prices** based on average cost changes
5. **Investigate** sudden average cost jumps

---

## Next Steps

- [Multi-UOM System](./03-multi-uom-system.md) - How UOM affects calculations
- [Receiving Products](./04-receiving-products.md) - Receipt processing
- [COGS Calculation](./05-cogs-calculation.md) - Sales costing

---

**Related Topics:**
- Inventory Valuation
- Gross Profit Analysis
- Pricing Strategies
