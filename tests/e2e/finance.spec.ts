import { test, expect } from '@playwright/test';

test.describe('Finance Module', () => {

    test.describe('AR/AP', () => {
        test.beforeEach(async ({ page }) => {
            await page.goto('/ar-ap');
        });

        test('should display AR/AP page', async ({ page }) => {
            await expect(page.getByRole('heading', { name: 'Accounts Receivable & Payable' })).toBeVisible();
        });

        test('should switch tabs', async ({ page }) => {
            await page.getByRole('tab', { name: 'Accounts Payable' }).click();
            await expect(page.getByRole('tab', { name: 'Accounts Payable', selected: true })).toBeVisible();

            await page.getByRole('tab', { name: 'Accounts Receivable' }).click();
            await expect(page.getByRole('tab', { name: 'Accounts Receivable', selected: true })).toBeVisible();
        });
    });

    test.describe('Expenses', () => {
        test.beforeEach(async ({ page }) => {
            await page.goto('/expenses');
        });

        test('should display expenses page', async ({ page }) => {
            await expect(page.getByRole('heading', { name: 'Expenses' })).toBeVisible();
            await expect(page.getByRole('button', { name: 'Add Expense' })).toBeVisible();
        });

        test('should open add expense dialog', async ({ page }) => {
            await page.getByRole('button', { name: 'Add Expense' }).click();
            await expect(page.getByRole('dialog')).toBeVisible();
            await expect(page.getByRole('heading', { name: 'Add Expense' })).toBeVisible();
        });
    });
});
