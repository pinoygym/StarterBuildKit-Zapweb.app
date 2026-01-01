
import { describe, it, expect } from 'vitest';
import {
    formatCurrency,
    formatQuantity,
    formatPercentage,
    formatNumber,
    formatDate,
    formatDateTime
} from '@/lib/utils'; // Adjust import path if necessary, assuming aliases work in tests

describe('Formatting Utilities', () => {
    describe('formatCurrency', () => {
        it('should format numbers as PHP currency', () => {
            expect(formatCurrency(1234.56)).toBe('₱1,234.56');
            expect(formatCurrency(0)).toBe('₱0.00');
            expect(formatCurrency(1000)).toBe('₱1,000.00');
        });

        it('should handle string inputs', () => {
            expect(formatCurrency('1234.56')).toBe('₱1,234.56');
        });

        it('should handle invalid inputs gracefully', () => {
            expect(formatCurrency(NaN)).toBe('₱0.00');
            expect(formatCurrency('invalid')).toBe('₱0.00');
        });
    });

    describe('formatQuantity', () => {
        it('should format quantities with 2 decimal places and separators', () => {
            expect(formatQuantity(1234.5678)).toBe('1,234.57'); // Rounding check
            expect(formatQuantity(1000)).toBe('1,000.00');
            expect(formatQuantity(0)).toBe('0.00');
        });

        it('should handle string inputs', () => {
            expect(formatQuantity('1234.56')).toBe('1,234.56');
        });

        it('should handle invalid inputs', () => {
            expect(formatQuantity('abc')).toBe('0.00');
        });
    });

    describe('formatPercentage', () => {
        it('should format numbers as percentages', () => {
            expect(formatPercentage(12.3456)).toBe('12.35%');
            expect(formatPercentage(100)).toBe('100.00%');
            expect(formatPercentage(0)).toBe('0.00%');
        });

        it('should handle string inputs', () => {
            expect(formatPercentage('50.5')).toBe('50.50%');
        });
    });

    describe('formatNumber', () => {
        it('should format numbers with separators and no decimals', () => {
            expect(formatNumber(1234.56)).toBe('1,235'); // Rounding to integer
            expect(formatNumber(1000000)).toBe('1,000,000');
        });
    });

    describe('formatDate', () => {
        it('should format dates correctly (MMM dd, yyyy)', () => {
            const date = new Date('2023-12-25T10:00:00');
            // Note: verification depends on local time zone if not forced to UTC in implementation
            // But typically we test if it produces a string.
            // Ideally we mock the locale or timezone, but for basic check:
            const formatted = formatDate(date);
            expect(formatted).toMatch(/Dec 25, 2023/);
        });
    });

    describe('formatDateTime', () => {
        it('should format date and time', () => {
            const date = new Date('2023-12-25T14:30:00');
            const formatted = formatDateTime(date);
            // "Dec 25, 2023, 02:30 PM" or similar depending on environment
            expect(formatted).toContain('Dec 25, 2023');
            // Time format might vary slightly by locale env, so loose check
            expect(formatted).toMatch(/:30/);
        });
    });
});
