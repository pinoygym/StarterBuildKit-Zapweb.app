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
            await page.click('text=Accounts Payable');
            await expect(page.getByRole('tab', { name: 'Accounts Payable', selected: true })).toBeVisible();

            await page.click('text=Accounts Receivable');
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
            await page.click('button:has-text("Add Expense")');
            await expect(page.getByRole('dialog')).toBeVisible();
            await expect(page.getByText('Add Expense')).toBeVisible();
        });
    });
});
