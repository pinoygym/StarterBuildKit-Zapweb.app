# Inventory Costing System Documentation

## Overview

This documentation covers the **Weighted Average Costing System** implemented in InventoryPro. The system accurately tracks product costs, calculates Cost of Goods Sold (COGS), and maintains inventory valuations across multiple units of measure (UOM).

---

## Table of Contents

1. [Overview](./01-overview.md) - System architecture and key concepts
2. [Weighted Average Costing](./02-weighted-average-costing.md) - How the costing method works
3. [Multi-UOM System](./03-multi-uom-system.md) - Unit of measure conversions
4. [Receiving Products](./04-receiving-products.md) - Purchase orders and receiving vouchers
5. [COGS Calculation](./05-cogs-calculation.md) - Cost of Goods Sold in POS sales
6. [Inventory Valuation](./06-inventory-valuation.md) - How inventory is valued
7. [FIFO vs Weighted Average](./07-fifo-vs-weighted-average.md) - Understanding the hybrid approach
8. [Troubleshooting](./08-troubleshooting.md) - Common issues and solutions
9. [API Reference](./09-api-reference.md) - Technical implementation details

---

## Quick Start

### Key Concept
All product costs are stored in the **base unit of measure (UOM)**. When receiving products in alternate UOMs (e.g., cases instead of bottles), the system automatically converts prices to the base UOM.

### Example
- **Product**: Coca-Cola
- **Base UOM**: bottles
- **Alternate UOM**: cases (12 bottles per case)
- **Receive**: 1 case at ₱140 per case
- **System converts**: ₱140 ÷ 12 = ₱11.67 per bottle
- **Stored as**: ₱11.67 per bottle (base UOM)

---

## System Benefits

✅ **Accurate Costing**: Weighted average smooths out price fluctuations
✅ **Multi-UOM Support**: Buy in cases, sell in bottles, track in base units
✅ **Automatic Conversion**: No manual calculations required
✅ **FIFO Physical Movement**: Expires oldest stock first
✅ **Real-time Updates**: Average cost updates with each receipt
✅ **Precision**: 4 decimal places prevent rounding errors

---

## Recent Updates

### 2025-11-21: UOM Price Conversion Fix
Fixed critical bug where prices in alternate UOMs were not being converted to base UOM during receiving. This ensures accurate weighted average cost calculations.

**Impact**: All inventory costs are now consistently stored in base UOM, preventing inflated COGS and incorrect profit margins.

See [Receiving Products](./04-receiving-products.md) for details.

---

## For Developers

- **Service**: `services/inventory.service.ts` - Core inventory logic
- **Service**: `services/receiving-voucher.service.ts` - Receiving and cost updates
- **Service**: `services/pos.service.ts` - COGS calculation
- **Types**: `types/inventory.types.ts` - Type definitions
- **Schema**: `prisma/schema.prisma` - Database models

---

## For Users

- Purchase products in any UOM (cases, packs, pieces)
- System automatically handles cost conversions
- View accurate profit margins in reports
- Track inventory value in real-time
- Understand true cost of goods sold

---

## Support

For questions or issues:
1. Check [Troubleshooting Guide](./08-troubleshooting.md)
2. Review [API Reference](./09-api-reference.md)
3. Contact system administrator

---

**Last Updated**: 2025-11-21
**Version**: 1.0.0
**Status**: Production Ready
