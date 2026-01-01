# Multi-UOM System

## Overview

InventoryPro supports multiple Units of Measure (UOM) for each product, allowing you to:
- Purchase in bulk units (cases, cartons, pallets)
- Sell in smaller units (bottles, cans, pieces)
- Track inventory in a single base unit

**Key Rule**: All costs are stored and calculated in the **base UOM**.

---

## UOM Structure

### Base UOM
Every product must have exactly **one base UOM**. This is the fundamental unit used for:
- Inventory quantity tracking
- Cost storage (`InventoryBatch.unitCost`)
- Average cost calculation (`Product.averageCostPrice`)
- COGS calculation

### Alternate UOMs
Products can have **multiple alternate UOMs** with:
- **Conversion Factor**: How many base units in this UOM
- **Selling Price**: Price when sold in this UOM

---

## Example Configuration

```
Product: Coca-Cola 500ml
├── Base UOM: bottles
│   ├── Base Price: ₱15/bottle
│   └── Average Cost: ₱10.50/bottle
│
├── Alternate UOM: 6-pack
│   ├── Conversion Factor: 6 (6 bottles per pack)
│   └── Selling Price: ₱85 (₱14.17/bottle)
│
└── Alternate UOM: case
    ├── Conversion Factor: 12 (12 bottles per case)
    └── Selling Price: ₱165 (₱13.75/bottle)
```

---

## Conversion Factor Explained

The **conversion factor** defines how many base units are contained in one alternate unit.

### Examples

| Product | Base UOM | Alternate UOM | Conversion Factor |
|---------|----------|---------------|-------------------|
| Coca-Cola | bottles | cases | 12 bottles/case |
| Coca-Cola | bottles | 6-pack | 6 bottles/pack |
| Noodles | packets | boxes | 20 packets/box |
| Water | bottles (500ml) | gallons | 8 bottles/gallon |
| Chips | bags | cartons | 24 bags/carton |

### Formula

```
Base Quantity = Alternate Quantity × Conversion Factor
```

**Example:**
- Buy 5 cases
- Conversion: 12 bottles/case
- Base Quantity: 5 × 12 = 60 bottles

---

## Price Conversion

### When Receiving Products

When you receive products in an alternate UOM, the price must be converted to base UOM:

```
Base UOM Price = Alternate UOM Price ÷ Conversion Factor
```

### Example 1: Receiving in Cases

```
Product: Pepsi 1L
Base UOM: bottles
Receive: 10 cases @ ₱240/case
Conversion Factor: 12 bottles/case

Price Conversion:
  ₱240 per case ÷ 12 bottles/case = ₱20 per bottle

Stored in Batch:
  Quantity: 120 bottles (10 × 12)
  Unit Cost: ₱20.0000/bottle ✅
```

### Example 2: Receiving in Pallets

```
Product: Water 500ml
Base UOM: bottles
Receive: 1 pallet @ ₱12,000/pallet
Conversion Factor: 1,200 bottles/pallet

Price Conversion:
  ₱12,000 per pallet ÷ 1,200 bottles/pallet = ₱10 per bottle

Stored in Batch:
  Quantity: 1,200 bottles
  Unit Cost: ₱10.0000/bottle ✅
```

### Example 3: Receiving in Base UOM

```
Product: Juice 1L
Base UOM: bottles
Receive: 50 bottles @ ₱18/bottle

No Conversion Needed:
  Price is already in base UOM

Stored in Batch:
  Quantity: 50 bottles
  Unit Cost: ₱18.0000/bottle ✅
```

---

## Selling in Different UOMs

### POS Sale Conversions

When selling, the quantity is converted to base UOM for COGS calculation:

```
Base Quantity = Sold Quantity × Conversion Factor
COGS = Average Cost per Base Unit × Base Quantity
```

### Example: Selling by Case

```
Product: Sprite 500ml
Base UOM: bottles
Average Cost: ₱11.50/bottle

Customer buys: 3 cases @ ₱180/case
Conversion Factor: 12 bottles/case

COGS Calculation:
  Base Quantity = 3 cases × 12 bottles/case = 36 bottles
  COGS = ₱11.50 × 36 = ₱414

Revenue:
  Selling Price = ₱180 × 3 = ₱540

Gross Profit:
  ₱540 - ₱414 = ₱126 (23.3% margin)
```

---

## Mixed UOM Transactions

### Purchase Order with Multiple UOMs

```
Purchase Order #PO-001
├── Item 1: Coca-Cola
│   ├── Quantity: 5 cases @ ₱140/case
│   └── Stored: 60 bottles @ ₱11.67/bottle
│
├── Item 2: Pepsi
│   ├── Quantity: 100 bottles @ ₱12/bottle
│   └── Stored: 100 bottles @ ₱12.00/bottle
│
└── Item 3: Sprite
    ├── Quantity: 10 6-packs @ ₱80/pack
    └── Stored: 60 bottles @ ₱13.33/bottle
```

### POS Sale with Multiple UOMs

```
Sale #RCP-20251121-0001
├── Item 1: Coca-Cola
│   ├── Sell: 2 cases @ ₱15/bottle
│   ├── COGS: 24 bottles × ₱11.67 = ₱280.08
│   └── Revenue: 24 × ₱15 = ₱360
│
├── Item 2: Pepsi
│   ├── Sell: 12 bottles @ ₱15/bottle
│   ├── COGS: 12 bottles × ₱12.00 = ₱144
│   └── Revenue: 12 × ₱15 = ₱180
│
└── Item 3: Sprite
    ├── Sell: 1 six-pack @ ₱85/pack
    ├── COGS: 6 bottles × ₱13.33 = ₱79.98
    └── Revenue: ₱85

Total COGS: ₱504.06
Total Revenue: ₱625
Gross Profit: ₱120.94 (19.4%)
```

---

## Code Implementation

### File: `services/inventory.service.ts`

```typescript
/**
 * Convert quantity from any UOM to base UOM
 */
async convertToBaseUOM(
  productId: string,
  quantity: number,
  uom: string
): Promise<number> {
  const product = await productService.getProductById(productId);

  // If already base UOM, return as-is
  if (uom.toLowerCase() === product.baseUOM.toLowerCase()) {
    return quantity;
  }

  // Find the alternate UOM
  const alternateUOM = product.alternateUOMs.find(
    (u: any) => u.name.toLowerCase() === uom.toLowerCase()
  );

  if (!alternateUOM) {
    throw new ValidationError(`UOM '${uom}' not found for product ${product.name}`, {
      uom: 'Invalid UOM for this product',
    });
  }

  // Convert: quantity × conversion factor = base quantity
  return quantity * Number(alternateUOM.conversionFactor);
}

/**
 * Calculate average cost for a product in a specific UOM
 */
async getAverageCostByUOM(
  productId: string,
  warehouseId: string,
  uom: string
): Promise<number> {
  const product = await productService.getProductById(productId);

  // If already base UOM, return the weighted average cost directly
  if (uom.toLowerCase() === product.baseUOM.toLowerCase()) {
    return await this.calculateWeightedAverageCost(productId, warehouseId);
  }

  // Find the alternate UOM
  const alternateUOM = product.alternateUOMs.find(
    (u: any) => u.name.toLowerCase() === uom.toLowerCase()
  );

  if (!alternateUOM) {
    throw new ValidationError(`UOM '${uom}' not found for product ${product.name}`, {
      uom: 'Invalid UOM for this product',
    });
  }

  // Get base UOM average cost
  const baseAverageCost = await this.calculateWeightedAverageCost(productId, warehouseId);

  // Convert: base cost × conversion factor = cost in selected UOM
  return baseAverageCost * Number(alternateUOM.conversionFactor);
}
```

---

## Best Practices

### 1. Choosing a Base UOM

Choose a base UOM that is:
✅ The smallest commonly used unit
✅ Easy to count and track
✅ Used across all operations
✅ Standard in your industry

**Examples:**
- Beverages: bottles, cans
- Food: packets, pieces
- Supplies: sheets, rolls

### 2. Setting Conversion Factors

Ensure conversion factors are:
✅ Accurate and verified
✅ Consistent across system
✅ Based on supplier packaging
✅ Documented clearly

**Common Mistakes:**
❌ Using 24 when actual is 20
❌ Mixing different package sizes
❌ Not updating when suppliers change

### 3. Pricing Strategies

For alternate UOM selling prices:
- Start with: Base Price × Conversion Factor
- Apply bulk discount if desired
- Round to convenient amounts
- Monitor margin percentages

**Example:**
```
Base: ₱15/bottle
Case (12): ₱15 × 12 = ₱180
Discount 10%: ₱180 × 0.9 = ₱162/case
Rounded: ₱160/case (₱13.33/bottle)
```

---

## Common Scenarios

### Scenario 1: Fractional Conversions

```
Product: Flour
Base UOM: kilograms
Alternate UOM: sacks (50kg)

Conversion Factor: 50 kg/sack

Receive: 10 sacks @ ₱2,500/sack
Price Conversion: ₱2,500 ÷ 50 = ₱50/kg
Stored: 500 kg @ ₱50/kg ✅
```

### Scenario 2: Volume Conversions

```
Product: Motor Oil
Base UOM: liters
Alternate UOM: gallons (3.785L)

Conversion Factor: 3.785 L/gallon

Receive: 20 gallons @ ₱380/gallon
Price Conversion: ₱380 ÷ 3.785 = ₱100.40/L
Stored: 75.7 liters @ ₱100.40/L ✅
```

### Scenario 3: Count-Based Packaging

```
Product: Instant Noodles
Base UOM: packets
Alternate UOMs:
  - Bundle: 5 packets (factor: 5)
  - Box: 20 packets (factor: 20)
  - Carton: 100 packets (factor: 100)

Receive: 50 cartons @ ₱1,200/carton
Price Conversion: ₱1,200 ÷ 100 = ₱12/packet
Stored: 5,000 packets @ ₱12/packet ✅
```

---

## Troubleshooting

### Issue: Wrong Conversion Factor

**Symptom**: Stock quantities seem incorrect
**Solution**: Verify conversion factors match actual packaging

### Issue: Price Conversion Not Working

**Symptom**: Average cost too high or too low
**Solution**: Check if UOM in PO matches alternate UOM name exactly

### Issue: Can't Sell in Alternate UOM

**Symptom**: POS shows error when selecting alternate UOM
**Solution**: Ensure alternate UOM is defined with selling price

---

## Database Schema

### Product Table
```sql
CREATE TABLE Product (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  baseUOM TEXT NOT NULL,           -- e.g., "bottles"
  averageCostPrice REAL DEFAULT 0, -- Always in base UOM
  basePrice REAL NOT NULL,         -- Base selling price
  -- other fields...
);
```

### ProductUOM Table
```sql
CREATE TABLE ProductUOM (
  id TEXT PRIMARY KEY,
  productId TEXT NOT NULL,
  name TEXT NOT NULL,              -- e.g., "cases"
  conversionFactor REAL NOT NULL,  -- e.g., 12
  sellingPrice REAL NOT NULL,      -- e.g., 165
  FOREIGN KEY (productId) REFERENCES Product(id)
);
```

---

## Next Steps

- [Receiving Products](./04-receiving-products.md) - How UOMs work in receiving
- [COGS Calculation](./05-cogs-calculation.md) - How UOMs affect COGS
- [Troubleshooting](./08-troubleshooting.md) - Common UOM issues

---

**Related Topics:**
- Product Configuration
- Purchase Order Processing
- POS Sales Configuration
