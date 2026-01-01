# Unit of Measure (UOM) Setup and Maintenance Guide

## Overview

This guide provides comprehensive instructions for setting up, maintaining, and troubleshooting Unit of Measure (UOM) conversions in the Inventory Pro system. Proper UOM configuration is critical for accurate inventory management, cost calculations, and receiving voucher processing.

## Table of Contents

1. [Understanding UOM Concepts](#understanding-uom-concepts)
2. [Initial Setup](#initial-setup)
3. [UOM Configuration](#uom-configuration)
4. [Maintenance Procedures](#maintenance-procedures)
5. [Troubleshooting](#troubleshooting)
6. [Best Practices](#best-practices)
7. [API Reference](#api-reference)

## Understanding UOM Concepts

### Base UOM vs. Alternative UOMs

- **Base UOM**: The primary unit for inventory tracking (e.g., "Bottle", "Kilogram", "Liter")
- **Alternative UOMs**: Larger/smaller packaging units (e.g., "Case", "Pack", "Pallet")

### Conversion Factors

Conversion factors define the relationship between UOMs:
- **Case (10 bottles)**: Conversion factor = 10 (1 case = 10 bottles)
- **Pack (6 bottles)**: Conversion factor = 6 (1 pack = 6 bottles)
- **Pallet (100 cases)**: Conversion factor = 1000 (1 pallet = 1000 bottles)

### Cost Calculations

When receiving inventory in alternative UOMs, costs are converted to base UOM:
```
Unit Cost in Base UOM = Purchase Price per Alternative UOM ÷ Conversion Factor
Example: ₱450 per case ÷ 10 bottles per case = ₱45 per bottle
```

## Initial Setup

### 1. Product Base UOM Configuration

Every product must have a base UOM defined:

```sql
-- Example: Set base UOM for a product
UPDATE Product
SET baseUOM = 'Bottle',
    minStockLevel = 100,
    shelfLifeDays = 365
WHERE id = 'product-id';
```

### 2. Create Alternative UOMs

For each product, define alternative packaging units:

```sql
-- Example: Add UOM configurations for Absolute Vodka
INSERT INTO ProductUOM (id, productId, name, conversionFactor, sellingPrice) VALUES
('uom-1', 'product-absolute', 'Case', 10, 450.00),
('uom-2', 'product-absolute', 'Pack', 6, 270.00),
('uom-3', 'product-absolute', 'Pallet', 1000, 40000.00);
```

### 3. Validation

Run validation queries to ensure proper setup:

```sql
-- Check for products missing base UOM
SELECT id, name, baseUOM
FROM Product
WHERE baseUOM IS NULL OR baseUOM = '';

-- Check for products missing UOM configurations
SELECT p.id, p.name, COUNT(pu.id) as uom_count
FROM Product p
LEFT JOIN ProductUOM pu ON p.id = pu.productId
GROUP BY p.id, p.name
HAVING uom_count = 0;

-- Validate conversion factors
SELECT pu.*, p.name as product_name
FROM ProductUOM pu
JOIN Product p ON pu.productId = p.id
WHERE pu.conversionFactor <= 0
   OR pu.conversionFactor IS NULL;
```

## UOM Configuration

### Adding New UOMs

1. **Access Product Management**
   - Navigate to Products → Product Details
   - Select the product to configure

2. **Add UOM Configuration**
   ```
   UOM Name: Case
   Conversion Factor: 12 (bottles per case)
   Selling Price: 540.00 (₱540 per case)
   ```

3. **Validation Rules**
   - UOM name must be unique per product
   - Conversion factor must be > 0
   - Selling price is optional but recommended

### Modifying Existing UOMs

⚠️ **Caution**: Modifying conversion factors can affect historical data accuracy.

1. **Impact Assessment**
   ```sql
   -- Check existing inventory batches using this UOM
   SELECT COUNT(*) as affected_batches
   FROM InventoryBatch ib
   JOIN Product p ON ib.productId = p.id
   JOIN ProductUOM pu ON p.id = pu.productId
   WHERE pu.name = 'Case' AND p.id = 'target-product-id';
   ```

2. **Safe Modification Process**
   - Create new UOM configuration
   - Update purchase orders to use new UOM
   - Deprecate old UOM (don't delete)
   - Run inventory reconciliation

### Removing UOMs

Never delete UOM configurations that have been used in transactions:

```sql
-- Check if UOM is safe to remove
SELECT
    (SELECT COUNT(*) FROM PurchaseOrderItem WHERE uom = 'Case') as po_usage,
    (SELECT COUNT(*) FROM ReceivingVoucherItem WHERE uom = 'Case') as rv_usage,
    (SELECT COUNT(*) FROM StockMovement WHERE reason LIKE '%Case%') as movement_usage;
```

## Maintenance Procedures

### Daily Monitoring

Run these checks daily:

```sql
-- Check for UOM conversion failures in recent logs
SELECT createdAt, level, message
FROM AuditLog
WHERE message LIKE '%UOM conversion%'
  AND createdAt >= CURRENT_DATE - INTERVAL '1 day'
ORDER BY createdAt DESC;

-- Validate inventory quantities make sense
SELECT
    p.name,
    SUM(ib.quantity) as total_inventory,
    AVG(ib.unitCost) as avg_cost,
    COUNT(ib.id) as batch_count
FROM InventoryBatch ib
JOIN Product p ON ib.productId = p.id
WHERE ib.status = 'active'
GROUP BY p.id, p.name
HAVING SUM(ib.quantity) < 0; -- Negative inventory check
```

### Weekly Maintenance

1. **UOM Usage Analysis**
   ```sql
   -- Most used UOMs by transaction volume
   SELECT
       uom,
       COUNT(*) as transaction_count,
       SUM(quantity) as total_quantity
   FROM (
       SELECT uom, quantity FROM PurchaseOrderItem
       UNION ALL
       SELECT uom, receivedQuantity FROM ReceivingVoucherItem
   ) combined
   GROUP BY uom
   ORDER BY transaction_count DESC;
   ```

2. **Cost Variance Analysis**
   ```sql
   -- Check for unusual cost variances
   SELECT
       p.name,
       AVG(rv.unitPrice) as avg_purchase_price,
       p.averageCostPrice as current_avg_cost,
       ABS(AVG(rv.unitPrice) - p.averageCostPrice) / p.averageCostPrice * 100 as variance_percent
   FROM ReceivingVoucherItem rv
   JOIN Product p ON rv.productId = p.id
   WHERE rv.createdAt >= CURRENT_DATE - INTERVAL '30 days'
   GROUP BY p.id, p.name, p.averageCostPrice
   HAVING ABS(AVG(rv.unitPrice) - p.averageCostPrice) / p.averageCostPrice * 100 > 20; -- >20% variance
   ```

### Monthly Reconciliation

1. **Inventory Reconciliation**
   ```sql
   -- Compare physical inventory vs. system inventory
   SELECT
       p.name,
       SUM(ib.quantity) as system_quantity,
       physical_inventory.actual_quantity, -- From manual count
       SUM(ib.quantity) - physical_inventory.actual_quantity as variance
   FROM InventoryBatch ib
   JOIN Product p ON ib.productId = p.id
   LEFT JOIN physical_inventory_counts physical_inventory ON p.id = physical_inventory.product_id
   WHERE ib.status = 'active'
   GROUP BY p.id, p.name, physical_inventory.actual_quantity;
   ```

2. **UOM Consistency Check**
   ```sql
   -- Ensure all products have consistent UOM usage
   SELECT DISTINCT
       p.id,
       p.name,
       p.baseUOM,
       STRING_AGG(DISTINCT poi.uom, ', ') as used_uoms
   FROM Product p
   JOIN PurchaseOrderItem poi ON p.id = poi.productId
   GROUP BY p.id, p.name, p.baseUOM
   HAVING STRING_AGG(DISTINCT poi.uom, ', ') NOT LIKE '%' || p.baseUOM || '%';
   ```

## Troubleshooting

### Common Issues

#### 1. "UOM conversion failed" Error

**Symptoms:**
- Receiving voucher creation fails with 500 error
- Error message contains "UOM conversion"

**Causes:**
- Missing UOM configuration for product
- Invalid conversion factor (0 or negative)
- UOM name mismatch (case sensitivity)

**Resolution:**
```sql
-- Check product UOM configuration
SELECT p.name, p.baseUOM, pu.name, pu.conversionFactor
FROM Product p
LEFT JOIN ProductUOM pu ON p.id = pu.productId
WHERE p.id = 'problematic-product-id';

-- Fix: Add missing UOM or correct conversion factor
INSERT INTO ProductUOM (id, productId, name, conversionFactor, sellingPrice)
VALUES (gen_random_uuid(), 'product-id', 'Case', 12, 540.00);
```

#### 2. Incorrect Inventory Quantities

**Symptoms:**
- Inventory shows wrong quantities after receiving
- Cost calculations appear incorrect

**Causes:**
- Wrong conversion factor
- UOM mismatch between purchase order and product config

**Resolution:**
```sql
-- Check recent receiving vouchers for the product
SELECT
    rv.rvNumber,
    rvi.uom,
    rvi.receivedQuantity as received_in_uom,
    ib.quantity as inventory_quantity,
    ib.unitCost
FROM ReceivingVoucher rv
JOIN ReceivingVoucherItem rvi ON rv.id = rvi.rvId
LEFT JOIN InventoryBatch ib ON ib.batchNumber LIKE '%' || rv.rvNumber || '%'
WHERE rvi.productId = 'problematic-product-id'
ORDER BY rv.createdAt DESC
LIMIT 5;

-- Correct conversion factor if needed
UPDATE ProductUOM
SET conversionFactor = 10 -- Correct value
WHERE productId = 'product-id' AND name = 'Case';
```

#### 3. Cost Calculation Errors

**Symptoms:**
- Product average cost is incorrect
- Profit calculations are wrong

**Causes:**
- UOM conversion not applied correctly
- Wrong unit price in purchase order

**Resolution:**
```sql
-- Recalculate product average cost
UPDATE Product
SET averageCostPrice = (
    SELECT AVG(unitCost)
    FROM InventoryBatch
    WHERE productId = 'product-id' AND status = 'active'
)
WHERE id = 'product-id';
```

### Debug Queries

```sql
-- UOM conversion debug for specific receiving voucher
SELECT
    rv.rvNumber,
    p.name as product_name,
    p.baseUOM,
    rvi.uom as received_uom,
    rvi.receivedQuantity,
    pu.conversionFactor,
    rvi.receivedQuantity * pu.conversionFactor as converted_quantity,
    ib.quantity as actual_inventory,
    rvi.unitPrice / pu.conversionFactor as cost_per_base_unit
FROM ReceivingVoucher rv
JOIN ReceivingVoucherItem rvi ON rv.id = rvi.rvId
JOIN Product p ON rvi.productId = p.id
LEFT JOIN ProductUOM pu ON p.id = pu.productId AND rvi.uom = pu.name
LEFT JOIN InventoryBatch ib ON ib.batchNumber LIKE '%' || rv.rvNumber || '%'
WHERE rv.id = 'rv-id';
```

## Best Practices

### Configuration

1. **Standardize UOM Names**
   - Use consistent naming: "Case", "Pack", "Pallet", "Box"
   - Avoid abbreviations that could be confused

2. **Validate Conversion Factors**
   - Double-check conversion factors with physical products
   - Document source of conversion factors

3. **Regular Audits**
   - Monthly review of UOM configurations
   - Quarterly inventory reconciliation

### Usage

1. **Purchase Order Creation**
   - Always specify UOM when creating POs
   - Verify UOM exists for the product

2. **Receiving Process**
   - Confirm UOM matches purchase order
   - Check quantities before submitting

3. **Training**
   - Train staff on UOM concepts
   - Document procedures for UOM changes

### Monitoring

1. **Automated Alerts**
   - Set up alerts for UOM conversion failures
   - Monitor inventory discrepancies

2. **Regular Reporting**
   - UOM usage reports
   - Cost variance analysis
   - Inventory accuracy metrics

## API Reference

### UOM Validation Endpoints

```typescript
// Validate UOM configuration
POST /api/products/{productId}/validate-uom
{
  "uom": "Case",
  "conversionFactor": 12
}

// Get UOM conversion
GET /api/products/{productId}/uom-conversion?from=Case&to=Bottle&quantity=5
```

### Error Codes

- `UOM_CONVERSION_FAILED`: UOM conversion calculation failed
- `UOM_NOT_FOUND`: Specified UOM not configured for product
- `INVALID_CONVERSION_FACTOR`: Conversion factor is invalid
- `UOM_MISMATCH`: UOM in transaction doesn't match product configuration

### Response Format

```json
{
  "success": true,
  "data": {
    "convertedQuantity": 50,
    "conversionFactor": 10,
    "fromUOM": "Case",
    "toUOM": "Bottle",
    "unitCostInBaseUOM": 45.00
  }
}
```

## Support

For additional support:
1. Check the troubleshooting section above
2. Review audit logs for error details
3. Contact the development team with specific error messages
4. Include product ID, UOM details, and transaction IDs when reporting issues

---

**Last Updated:** November 2024
**Version:** 1.0
**Authors:** Inventory Pro Development Team