import { test, expect } from '@playwright/test';
import path from 'path';

// Screenshot directory in artifacts
const SCREENSHOT_DIR = path.join(
    'C:',
    'Users',
    'HI',
    '.gemini',
    'antigravity',
    'brain',
    '307a9444-7d2c-43f8-98ae-fbaa6ba56eb6',
    'screenshots'
);

test.describe('UI/UX Screenshot Testing', () => {
    // Helper function to login
    async function login(page: any) {
        // Check if already on a dashboard page
        if (page.url().includes('dashboard')) {
            return;
        }

        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');

        // If redirected to login, then we need to log in
        if (page.url().includes('login')) {
            await page.fill('input[type="email"]', 'cybergada@gmail.com');
            await page.fill('input[type="password"]', 'Qweasd1234');
            await page.click('button[type="submit"]');
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(2000);
        }
    }

    test.describe('Unauthenticated Pages', () => {
        // Clear storageState for these tests to see the login page
        test.use({ storageState: { cookies: [], origins: [] } });

        test('01 - Login Page', async ({ page }) => {
            await page.goto('http://localhost:3000/login');
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);

            await page.screenshot({
                path: path.join(SCREENSHOT_DIR, '01-login-page.png'),
                fullPage: true,
            });

            console.log('✓ Captured: Login Page');
        });

        test('02 - Login Form Filled', async ({ page }) => {
            await page.goto('http://localhost:3000/login');
            await page.waitForLoadState('networkidle');

            await page.getByLabel(/email/i).fill('cybergada@gmail.com');
            await page.getByLabel(/password/i).fill('Qweasd1234');
            await page.waitForTimeout(500);

            await page.screenshot({
                path: path.join(SCREENSHOT_DIR, '02-login-form-filled.png'),
                fullPage: true,
            });

            console.log('✓ Captured: Login Form Filled');
        });
    });

    test('03 - Dashboard Full Page', async ({ page }) => {
        await login(page);

        await page.screenshot({
            path: path.join(SCREENSHOT_DIR, '03-dashboard-full.png'),
            fullPage: true,
        });

        console.log('✓ Captured: Dashboard Full Page');
    });

    test('04 - Dashboard Viewport', async ({ page }) => {
        await login(page);

        await page.screenshot({
            path: path.join(SCREENSHOT_DIR, '04-dashboard-viewport.png'),
            fullPage: false,
        });

        console.log('✓ Captured: Dashboard Viewport');
    });

    test('05 - Products Page', async ({ page }) => {
        await login(page);

        await page.goto('http://localhost:3000/products');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1500);

        await page.screenshot({
            path: path.join(SCREENSHOT_DIR, '05-products-page.png'),
            fullPage: true,
        });

        console.log('✓ Captured: Products Page');
    });

    test('06 - Inventory Page', async ({ page }) => {
        await login(page);

        await page.goto('http://localhost:3000/inventory');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1500);

        await page.screenshot({
            path: path.join(SCREENSHOT_DIR, '06-inventory-page.png'),
            fullPage: true,
        });

        console.log('✓ Captured: Inventory Page');
    });

    test('07 - POS Page', async ({ page }) => {
        await login(page);

        await page.goto('http://localhost:3000/pos');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1500);

        await page.screenshot({
            path: path.join(SCREENSHOT_DIR, '07-pos-page.png'),
            fullPage: true,
        });

        console.log('✓ Captured: POS Page');
    });

    test('08 - Sales Page', async ({ page }) => {
        await login(page);

        await page.goto('http://localhost:3000/sales');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1500);

        await page.screenshot({
            path: path.join(SCREENSHOT_DIR, '08-sales-page.png'),
            fullPage: true,
        });

        console.log('✓ Captured: Sales Page');
    });

    test('09 - Purchases Page', async ({ page }) => {
        await login(page);

        await page.goto('http://localhost:3000/purchases');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1500);

        await page.screenshot({
            path: path.join(SCREENSHOT_DIR, '09-purchases-page.png'),
            fullPage: true,
        });

        console.log('✓ Captured: Purchases Page');
    });

    test('10 - Customers Page', async ({ page }) => {
        await login(page);

        await page.goto('http://localhost:3000/customers');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1500);

        await page.screenshot({
            path: path.join(SCREENSHOT_DIR, '10-customers-page.png'),
            fullPage: true,
        });

        console.log('✓ Captured: Customers Page');
    });

    test('11 - Settings Page', async ({ page }) => {
        await login(page);

        await page.goto('http://localhost:3000/settings');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1500);

        await page.screenshot({
            path: path.join(SCREENSHOT_DIR, '11-settings-page.png'),
            fullPage: true,
        });

        console.log('✓ Captured: Settings Page');
    });

    test('12 - Mobile Dashboard', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });
        await login(page);

        await page.screenshot({
            path: path.join(SCREENSHOT_DIR, '12-mobile-dashboard.png'),
            fullPage: true,
        });

        console.log('✓ Captured: Mobile Dashboard');
    });

    test('13 - Tablet Dashboard', async ({ page }) => {
        await page.setViewportSize({ width: 768, height: 1024 });
        await login(page);

        await page.screenshot({
            path: path.join(SCREENSHOT_DIR, '13-tablet-dashboard.png'),
            fullPage: true,
        });

        console.log('✓ Captured: Tablet Dashboard');
    });

    test('14 - Navigation Menu', async ({ page }) => {
        await login(page);
        await page.waitForTimeout(1000);

        await page.screenshot({
            path: path.join(SCREENSHOT_DIR, '14-navigation-menu.png'),
            fullPage: false,
        });

        console.log('✓ Captured: Navigation Menu');
    });
});
