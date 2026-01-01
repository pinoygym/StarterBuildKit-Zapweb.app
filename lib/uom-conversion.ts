/**
 * Unit of Measure (UOM) Conversion Utilities
 *
 * Provides utilities for converting between different units of measure,
 * particularly for inventory management and receiving voucher calculations.
 */

export interface UOMConversionResult {
  success: boolean;
  convertedQuantity: number;
  conversionFactor: number;
  fromUOM: string;
  toUOM: string;
  error?: string;
}

export interface ProductUOMData {
  id: string;
  name: string;
  conversionFactor: number;
}

/**
 * Find UOM conversion data with flexible matching
 */
export function findUOMConversion(
  availableUOMs: ProductUOMData[],
  targetUOM: string,
  baseUOM: string
): ProductUOMData | null {
  // First try exact match
  let uom = availableUOMs.find(u => u.name.toLowerCase() === targetUOM.toLowerCase());

  // If no exact match, try partial match
  if (!uom) {
    uom = availableUOMs.find(u =>
      u.name.toLowerCase().includes(targetUOM.toLowerCase()) ||
      targetUOM.toLowerCase().includes(u.name.toLowerCase())
    );
  }

  return uom || null;
}

/**
 * Convert quantity from one UOM to another
 */
export function convertUOMQuantity(
  quantity: number,
  fromUOM: string,
  toUOM: string,
  availableUOMs: ProductUOMData[]
): UOMConversionResult {
  // No conversion needed if UOMs are the same
  if (fromUOM.toLowerCase() === toUOM.toLowerCase()) {
    return {
      success: true,
      convertedQuantity: quantity,
      conversionFactor: 1,
      fromUOM,
      toUOM
    };
  }

  // Find conversion data
  const conversionUOM = findUOMConversion(availableUOMs, fromUOM, toUOM);

  if (!conversionUOM) {
    return {
      success: false,
      convertedQuantity: 0,
      conversionFactor: 0,
      fromUOM,
      toUOM,
      error: `No conversion found for ${fromUOM} to ${toUOM}. Available UOMs: ${availableUOMs.map(u => u.name).join(', ')}`
    };
  }

  if (!Number(conversionUOM.conversionFactor) || Number(conversionUOM.conversionFactor) <= 0) {
    return {
      success: false,
      convertedQuantity: 0,
      conversionFactor: 0,
      fromUOM,
      toUOM,
      error: `Invalid conversion factor ${conversionUOM.conversionFactor} for ${conversionUOM.name}`
    };
  }

  const convertedQuantity = quantity * Number(conversionUOM.conversionFactor);

  return {
    success: true,
    convertedQuantity,
    conversionFactor: Number(conversionUOM.conversionFactor),
    fromUOM,
    toUOM
  };
}

/**
 * Validate UOM conversion data
 */
export function validateUOMData(uomData: ProductUOMData): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!uomData.name || uomData.name.trim().length === 0) {
    errors.push('UOM name is required');
  }

  if (!uomData.conversionFactor || !Number(uomData.conversionFactor)) {
    errors.push('Conversion factor must be a valid number');
  } else if (Number(uomData.conversionFactor) <= 0) {
    errors.push('Conversion factor must be greater than 0');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Calculate unit cost in base UOM
 */
export function calculateUnitCostInBaseUOM(
  unitPrice: number,
  fromUOM: string,
  toUOM: string,
  availableUOMs: ProductUOMData[]
): { success: boolean; unitCostInBaseUOM: number; error?: string } {
  const conversion = convertUOMQuantity(1, fromUOM, toUOM, availableUOMs);

  if (!conversion.success) {
    return {
      success: false,
      unitCostInBaseUOM: 0,
      error: conversion.error
    };
  }

  // If converting from larger unit to smaller unit (e.g., case to bottle),
  // the unit cost per base unit is lower
  const unitCostInBaseUOM = unitPrice / conversion.conversionFactor;

  return {
    success: true,
    unitCostInBaseUOM
  };
}