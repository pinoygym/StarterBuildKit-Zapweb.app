import { chromium } from 'playwright';
import * as path from 'path';

const SCREENSHOT_DIR = path.join(process.cwd(), '.gemini', 'antigravity', 'brain', 'eefaf751-67fa-4d5e-a5a9-c017af1e2461', 'screenshots');

async function captureUIScreenshots() {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 }
    });
    const page = await context.newPage();

    try {
        console.log('Starting UI/UX screenshot capture...');
        console.log(`Screenshots will be saved to: ${SCREENSHOT_DIR}`);

        // 1. Landing/Login Page
        console.log('Capturing landing page...');
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);
        await page.screenshot({
            path: path.join(SCREENSHOT_DIR, '01-landing-page.png'),
            fullPage: true
        });

        // 2. Login Form Filled
        console.log('Filling login form...');
        const emailInput = await page.locator('input[type="email"], input[name="email"]').first();
        const passwordInput = await page.locator('input[type="password"], input[name="password"]').first();

        await emailInput.fill('cybergada@gmail.com');
        await passwordInput.fill('Qweasd145698@');
        await page.waitForTimeout(1000);

        await page.screenshot({
            path: path.join(SCREENSHOT_DIR, '02-login-form-filled.png'),
            fullPage: true
        });

        // 3. Submit login
        console.log('Submitting login...');
        const loginButton = await page.locator('button[type="submit"]').first();
        await loginButton.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);

        // 4. Dashboard
        console.log('Capturing dashboard...');
        await page.screenshot({
            path: path.join(SCREENSHOT_DIR, '03-dashboard-full.png'),
            fullPage: true
        });
        await page.screenshot({
            path: path.join(SCREENSHOT_DIR, '04-dashboard-viewport.png'),
            fullPage: false
        });

        // 5. Products Page
        console.log('Navigating to products...');
        try {
            await page.click('a[href*="product"]', { timeout: 5000 });
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(2000);
            await page.screenshot({
                path: path.join(SCREENSHOT_DIR, '05-products-page.png'),
                fullPage: true
            });
        } catch (e: any) {
            console.log('Could not navigate to products:', e.message);
        }

        // 6. Inventory Page
        console.log('Navigating to inventory...');
        try {
            await page.click('a[href*="inventory"]', { timeout: 5000 });
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(2000);
            await page.screenshot({
                path: path.join(SCREENSHOT_DIR, '06-inventory-page.png'),
                fullPage: true
            });
        } catch (e: any) {
            console.log('Could not navigate to inventory:', e.message);
        }

        // 7. POS Page
        console.log('Navigating to POS...');
        try {
            await page.click('a[href*="pos"]', { timeout: 5000 });
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(2000);
            await page.screenshot({
                path: path.join(SCREENSHOT_DIR, '07-pos-page.png'),
                fullPage: true
            });
        } catch (e: any) {
            console.log('Could not navigate to POS:', e.message);
        }

        // 8. Sales Page
        console.log('Navigating to sales...');
        try {
            await page.click('a[href*="sales"]', { timeout: 5000 });
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(2000);
            await page.screenshot({
                path: path.join(SCREENSHOT_DIR, '08-sales-page.png'),
                fullPage: true
            });
        } catch (e: any) {
            console.log('Could not navigate to sales:', e.message);
        }

        // 9. Purchases Page
        console.log('Navigating to purchases...');
        try {
            await page.click('a[href*="purchase"]', { timeout: 5000 });
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(2000);
            await page.screenshot({
                path: path.join(SCREENSHOT_DIR, '09-purchases-page.png'),
                fullPage: true
            });
        } catch (e: any) {
            console.log('Could not navigate to purchases:', e.message);
        }

        // 10. Customers Page
        console.log('Navigating to customers...');
        try {
            await page.click('a[href*="customer"]', { timeout: 5000 });
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(2000);
            await page.screenshot({
                path: path.join(SCREENSHOT_DIR, '10-customers-page.png'),
                fullPage: true
            });
        } catch (e: any) {
            console.log('Could not navigate to customers:', e.message);
        }

        // 11. Settings Page
        console.log('Navigating to settings...');
        try {
            await page.click('a[href*="settings"]', { timeout: 5000 });
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(2000);
            await page.screenshot({
                path: path.join(SCREENSHOT_DIR, '11-settings-page.png'),
                fullPage: true
            });
        } catch (e: any) {
            console.log('Could not navigate to settings:', e.message);
        }

        // 12. Mobile View - Dashboard
        console.log('Capturing mobile view...');
        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);
        await page.screenshot({
            path: path.join(SCREENSHOT_DIR, '12-mobile-dashboard.png'),
            fullPage: true
        });

        // 13. Tablet View - Dashboard
        console.log('Capturing tablet view...');
        await page.setViewportSize({ width: 768, height: 1024 });
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);
        await page.screenshot({
            path: path.join(SCREENSHOT_DIR, '13-tablet-dashboard.png'),
            fullPage: true
        });

        console.log('✅ Screenshot capture complete!');
        console.log(`Screenshots saved to: ${SCREENSHOT_DIR}`);

    } catch (error) {
        console.error('Error during screenshot capture:', error);
    } finally {
        await browser.close();
    }
}

captureUIScreenshots();
