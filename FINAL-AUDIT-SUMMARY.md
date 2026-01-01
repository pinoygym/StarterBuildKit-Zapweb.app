# Inventory Audit Final Summary (ADJ-01 to ADJ-10)

This document summarizes the audit results for over **270 inventory items** checked across 10 handwritten lists against the system records.

## Audit Overview Summary

| Adjustment Ref | Warehouse / Area | Total Items | Matched | Discrepancies | Status |
| :--- | :--- | :--: | :--: | :--: | :--- |
| **ADJ-01** | Mabini Bodega | 62 | 60 | 2 | ⚠️ Minor Issues |
| **ADJ-02** | Mabini Bodega | 18 | 16 | 2 | ❌ Critical UOM Issues |
| **ADJ-03** | (Not specified) | 9 | 8 | 1 | ⚠️ 1 Item Mismatch |
| **ADJ-04** | (Not specified) | 17 | 17 | 0 | ✅ Perfect Match |
| **ADJ-05** | Store | 19 | 18 | 1 | ⚠️ 1 Item Mismatch |
| **ADJ-06** | Store | 44 | 44 | 0 | ✅ Perfect Match |
| **ADJ-07** | Store | 38 | 38 | 0 | ✅ Perfect Match |
| **ADJ-08** | Store | 14 | 14 | 0 | ✅ Perfect Match |
| **ADJ-09** | Store | 31 | 30 | 1 | ℹ️ Label Discrepancy |
| **ADJ-10** | (Not specified) | 27 | 27 | 0 | ✅ Perfect Match |
| **TOTAL** | | **279** | **272** | **7** | **97.5% Accuracy** |

---

## Detailed List of Discrepancies

The following items were identified as having mismatches in quantity, name, or unit of measure:

| Adj Ref | Product Name (Handwritten) | Image Quantity | System Record | System Qty | Deviation | Issue Type |
| :--- | :--- | :--- | :--- | :--- | :--: | :--- |
| **ADJ-01** | Blend | 27 sack | Island edited | 23 sack | -4 | Name / Qty Mismatch |
| **ADJ-01** | (Not in image) | - | Sprinter Unico | 34 BOX | +34 | Extra Item in System |
| **ADJ-02** | Excellent 2x3 (02) | 45 rms | Excellent 2x3 (02) | 45 rem | (x10) | Missing Factor 10 |
| **ADJ-02** | Excellent 8x12 (02) | 20 rms | Excellent 8x12 (02) | 40 rem | +20 | Encoding + Factor 10 |
| **ADJ-03** | Express chicken layers | 2 sack | Express Chicken Layex 1 | 3 sack | +1 | Qty Mismatch |
| **ADJ-05** | 8 x 14 HD | 177 pcs | PLASTIC - King 8x14 HD | 173 pack | -4 | Qty Mismatch |
| **ADJ-09** | Panadero | 19 kilo | Bensdorp edited | 19 kilo | 0 | Labeling Error |

---

## Technical Observations

1.  **UOM Conversions**: The "rms" (reams) to "pack" conversion in **ADJ-02** showed inconsistencies (some items multiplied by 10, others recorded 1:1), leading to significant stock discrepancies for those specific products.
2.  **Aggregation Success**: In **ADJ-10**, the system successfully aggregated multiple handwritten entries for the same product ("Runner #5") into a single consolidated record.
3.  **Accuracy Rate**: With a **97.5% line-item match rate**, the digital recording process for these adjustments is highly reliable, with discrepancies localized to specific unit conversion logic or manual entry slips.

> [!TIP]
> The full line-by-line comparison tables are available in the [INVENTORY-AUDIT-REPORT.md](file:///c:/Users/cyber/Documents/GitHub/buenasv2/INVENTORY-AUDIT-REPORT.md) file.
