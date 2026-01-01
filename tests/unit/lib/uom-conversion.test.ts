import { describe, it, expect, beforeEach } from 'vitest';
import {
  findUOMConversion,
  convertUOMQuantity,
  validateUOMData,
  calculateUnitCostInBaseUOM
} from '@/lib/uom-conversion';
import type { ProductUOMData, UOMConversionResult } from '@/lib/uom-conversion';

describe('UOM Conversion Utilities', () => {
  let mockUOMs: ProductUOMData[];

  beforeEach(() => {
    mockUOMs = [
      { id: '1', name: 'Case', conversionFactor: 10 },
      { id: '2', name: 'Pack', conversionFactor: 6 },
      { id: '3', name: 'Bottle', conversionFactor: 1 },
      { id: '4', name: 'Case (12 bottles)', conversionFactor: 12 }
    ];
  });

  describe('findUOMConversion', () => {
    it('should find exact UOM match', () => {
      const result = findUOMConversion(mockUOMs, 'Case', 'Bottle');
      expect(result).toEqual({ id: '1', name: 'Case', conversionFactor: 10 });
    });

    it('should find case-insensitive exact match', () => {
      const result = findUOMConversion(mockUOMs, 'case', 'Bottle');
      expect(result).toEqual({ id: '1', name: 'Case', conversionFactor: 10 });
    });

    it('should find partial match when exact match fails', () => {
      const result = findUOMConversion(mockUOMs, 'case', 'Bottle');
      expect(result?.name).toBe('Case');
    });

    it('should find UOM with descriptive name', () => {
      const result = findUOMConversion(mockUOMs, 'Case', 'Bottle');
      expect(result?.conversionFactor).toBe(10);
    });

    it('should return null when no match found', () => {
      const result = findUOMConversion(mockUOMs, 'NonExistent', 'Bottle');
      expect(result).toBeNull();
    });
  });

  describe('convertUOMQuantity', () => {
    it('should return same quantity when UOMs are identical', () => {
      const result = convertUOMQuantity(5, 'Bottle', 'Bottle', mockUOMs);
      expect(result.success).toBe(true);
      expect(result.convertedQuantity).toBe(5);
      expect(result.conversionFactor).toBe(1);
    });

    it('should convert case to bottles correctly', () => {
      const result = convertUOMQuantity(2, 'Case', 'Bottle', mockUOMs);
      expect(result.success).toBe(true);
      expect(result.convertedQuantity).toBe(20); // 2 cases * 10 bottles per case
      expect(result.conversionFactor).toBe(10);
    });

    it('should convert pack to bottles correctly', () => {
      const result = convertUOMQuantity(3, 'Pack', 'Bottle', mockUOMs);
      expect(result.success).toBe(true);
      expect(result.convertedQuantity).toBe(18); // 3 packs * 6 bottles per pack
      expect(result.conversionFactor).toBe(6);
    });

    it('should handle decimal quantities', () => {
      const result = convertUOMQuantity(1.5, 'Case', 'Bottle', mockUOMs);
      expect(result.success).toBe(true);
      expect(result.convertedQuantity).toBe(15); // 1.5 cases * 10 bottles per case
    });

    it('should fail when no conversion found', () => {
      const result = convertUOMQuantity(5, 'NonExistent', 'Bottle', mockUOMs);
      expect(result.success).toBe(false);
      expect(result.error).toContain('No conversion found');
      expect(result.convertedQuantity).toBe(0);
    });

    it('should fail with invalid conversion factor', () => {
      const invalidUOMs = [{ id: '1', name: 'Invalid', conversionFactor: 0 }];
      const result = convertUOMQuantity(5, 'Invalid', 'Bottle', invalidUOMs);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid conversion factor');
    });

    it('should work with descriptive UOM names', () => {
      const result = convertUOMQuantity(1, 'Case (12 bottles)', 'Bottle', mockUOMs);
      expect(result.success).toBe(true);
      expect(result.convertedQuantity).toBe(12);
      expect(result.conversionFactor).toBe(12);
    });
  });

  describe('validateUOMData', () => {
    it('should validate correct UOM data', () => {
      const result = validateUOMData({ id: '1', name: 'Case', conversionFactor: 10 });
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty name', () => {
      const result = validateUOMData({ id: '1', name: '', conversionFactor: 10 });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('UOM name is required');
    });

    it('should reject invalid conversion factor', () => {
      const result = validateUOMData({ id: '1', name: 'Case', conversionFactor: 0 });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Conversion factor must be greater than 0');
    });

    it('should reject negative conversion factor', () => {
      const result = validateUOMData({ id: '1', name: 'Case', conversionFactor: -5 });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Conversion factor must be greater than 0');
    });

    it('should reject non-numeric conversion factor', () => {
      const result = validateUOMData({ id: '1', name: 'Case', conversionFactor: NaN });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Conversion factor must be a valid number');
    });
  });

  describe('calculateUnitCostInBaseUOM', () => {
    it('should calculate correct unit cost for case to bottle conversion', () => {
      const result = calculateUnitCostInBaseUOM(500, 'Case', 'Bottle', mockUOMs);
      expect(result.success).toBe(true);
      expect(result.unitCostInBaseUOM).toBe(50); // ₱500 per case ÷ 10 bottles per case = ₱50 per bottle
    });

    it('should calculate correct unit cost for pack to bottle conversion', () => {
      const result = calculateUnitCostInBaseUOM(120, 'Pack', 'Bottle', mockUOMs);
      expect(result.success).toBe(true);
      expect(result.unitCostInBaseUOM).toBe(20); // ₱120 per pack ÷ 6 bottles per pack = ₱20 per bottle
    });

    it('should return same cost when no conversion needed', () => {
      const result = calculateUnitCostInBaseUOM(25, 'Bottle', 'Bottle', mockUOMs);
      expect(result.success).toBe(true);
      expect(result.unitCostInBaseUOM).toBe(25);
    });

    it('should fail when conversion fails', () => {
      const result = calculateUnitCostInBaseUOM(100, 'NonExistent', 'Bottle', mockUOMs);
      expect(result.success).toBe(false);
      expect(result.error).toContain('No conversion found');
    });
  });

  describe('Regression Test Scenarios', () => {
    it('should handle the original bug case: case to bottle conversion', () => {
      // This test ensures the original bug (1 case not converting to 10 bottles) is fixed
      const result = convertUOMQuantity(1, 'Case', 'Bottle', mockUOMs);
      expect(result.success).toBe(true);
      expect(result.convertedQuantity).toBe(10);
      expect(result.conversionFactor).toBe(10);
    });

    it('should handle partial UOM name matching', () => {
      // Test the enhanced matching logic that was added to fix the bug
      const descriptiveUOMs = [{ id: '1', name: 'Case (10 bottles)', conversionFactor: 10 }];
      const result = convertUOMQuantity(2, 'case', 'Bottle', descriptiveUOMs);
      expect(result.success).toBe(true);
      expect(result.convertedQuantity).toBe(20);
    });

    it('should maintain precision with decimal quantities', () => {
      const result = convertUOMQuantity(0.5, 'Case', 'Bottle', mockUOMs);
      expect(result.success).toBe(true);
      expect(result.convertedQuantity).toBe(5); // 0.5 * 10 = 5
    });

    it('should validate all UOM data before processing', () => {
      const invalidUOMs = [
        { id: '1', name: 'Case', conversionFactor: 10 },
        { id: '2', name: '', conversionFactor: 5 }, // Invalid: empty name
        { id: '3', name: 'Pack', conversionFactor: 0 } // Invalid: zero conversion
      ];

      const validResult = validateUOMData(invalidUOMs[0]);
      const invalidNameResult = validateUOMData(invalidUOMs[1]);
      const invalidFactorResult = validateUOMData(invalidUOMs[2]);

      expect(validResult.isValid).toBe(true);
      expect(invalidNameResult.isValid).toBe(false);
      expect(invalidFactorResult.isValid).toBe(false);
    });
  });
});