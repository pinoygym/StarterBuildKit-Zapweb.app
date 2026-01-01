import { test, expect } from '@playwright/test';
import path from 'path';

const SCREENSHOT_DIR = path.join(process.cwd(), '.gemini', 'antigravity', 'brain', '307a9444-7d2c-43f8-98ae-fbaa6ba56eb6', 'screenshots');

test.describe('UI/UX Testing - Comprehensive', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to the application
        await page.goto('http://localhost:3000');
    });

    test('01 - Login Page', async ({ page }) => {
        // Since we are already logged in via storageState, we navigate to login to see if it redirects
        await page.goto('/login');
        await page.waitForLoadState('networkidle');

        // Screenshot 1: Login page (might redirect if already logged in)
        await page.screenshot({
            path: path.join(SCREENSHOT_DIR, '01-landing-page.png'),
            fullPage: true
        });

        console.log('Current URL:', page.url());
    });

    test('02 - Dashboard Overview', async ({ page }) => {
        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');

        // Screenshot: Full dashboard
        await page.screenshot({
            path: path.join(SCREENSHOT_DIR, '05-dashboard-full.png'),
            fullPage: true
        });

        // Screenshot: Dashboard viewport (above the fold)
        await page.screenshot({
            path: path.join(SCREENSHOT_DIR, '06-dashboard-viewport.png'),
            fullPage: false
        });
    });

    test('03 - Navigation Menu', async ({ page }) => {
        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');

        // Screenshot: Navigation/sidebar
        await page.screenshot({
            path: path.join(SCREENSHOT_DIR, '07-navigation-menu.png'),
            fullPage: true
        });
    });

    test('04 - Products Page', async ({ page }) => {
        await page.goto('/products');
        await page.waitForLoadState('networkidle');

        // Screenshot: Products listing
        await page.screenshot({
            path: path.join(SCREENSHOT_DIR, '08-products-listing.png'),
            fullPage: true
        });
    });

    test('05 - Inventory Page', async ({ page }) => {
        await page.goto('/inventory');
        await page.waitForLoadState('networkidle');

        // Screenshot: Inventory listing
        await page.screenshot({
            path: path.join(SCREENSHOT_DIR, '09-inventory-listing.png'),
            fullPage: true
        });
    });

    test('06 - POS System', async ({ page }) => {
        await page.goto('/pos');
        await page.waitForLoadState('networkidle');

        // Screenshot: POS interface
        await page.screenshot({
            path: path.join(SCREENSHOT_DIR, '10-pos-interface.png'),
            fullPage: true
        });
    });

    test('07 - Sales Page', async ({ page }) => {
        await page.goto('/sales');
        await page.waitForLoadState('networkidle');

        // Screenshot: Sales listing
        await page.screenshot({
            path: path.join(SCREENSHOT_DIR, '11-sales-listing.png'),
            fullPage: true
        });
    });

    test('08 - Purchases Page', async ({ page }) => {
        await page.goto('/purchase-orders');
        await page.waitForLoadState('networkidle');

        // Screenshot: Purchases listing
        await page.screenshot({
            path: path.join(SCREENSHOT_DIR, '12-purchases-listing.png'),
            fullPage: true
        });
    });

    test('09 - Customers Page', async ({ page }) => {
        await page.goto('/customers');
        await page.waitForLoadState('networkidle');

        // Screenshot: Customers listing
        await page.screenshot({
            path: path.join(SCREENSHOT_DIR, '13-customers-listing.png'),
            fullPage: true
        });
    });

    test('10 - Settings Page', async ({ page }) => {
        await page.goto('/settings');
        await page.waitForLoadState('networkidle');

        // Screenshot: Settings page
        await page.screenshot({
            path: path.join(SCREENSHOT_DIR, '14-settings-page.png'),
            fullPage: true
        });
    });

    test('11 - Mobile Responsive - Dashboard', async ({ page }) => {
        // Set mobile viewport
        await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE

        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');

        // Screenshot: Mobile dashboard
        await page.screenshot({
            path: path.join(SCREENSHOT_DIR, '15-mobile-dashboard.png'),
            fullPage: true
        });
    });

    test('12 - Tablet Responsive - Dashboard', async ({ page }) => {
        // Set tablet viewport
        await page.setViewportSize({ width: 768, height: 1024 }); // iPad

        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');

        // Screenshot: Tablet dashboard
        await page.screenshot({
            path: path.join(SCREENSHOT_DIR, '16-tablet-dashboard.png'),
            fullPage: true
        });
    });
});
