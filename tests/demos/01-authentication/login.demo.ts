import { test, expect } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'fs';
import { NarrationHelper } from '../helpers/narration.helper';
import { DemoActions } from '../helpers/demo-actions.helper';
import { MouseTracker } from '../helpers/mouse-tracker.helper';
import { KeyboardDisplay } from '../helpers/keyboard-display.helper';

test.describe('Login & Authentication Demo', () => {
  test('user login and dashboard navigation', async ({ page }) => {
    const narration = new NarrationHelper('User Login & Dashboard Navigation');
    const demo = new DemoActions(page);
    const mouseTracker = new MouseTracker();
    const keyboardDisplay = new KeyboardDisplay();

    // Create output directory
    const outputDir = 'demo-recordings/01-authentication';
    try {
      mkdirSync(outputDir, { recursive: true });
    } catch (e) {
      // Directory already exists
    }

    // Intro
    await narration.narrate(
      'Welcome to InventoryPro, a comprehensive inventory management and point of sale system. In this video, we will learn how to log into the system.',
      5000
    );

    // Navigate to login (start fresh)
    await page.goto('/login');
    await narration.narrate('This is the login page where users access the system.', 3000);

    // Inject interactive elements after page loads
    await mouseTracker.inject(page);
    await keyboardDisplay.inject(page);

    // Wait for login form
    await expect(page.getByLabel(/email/i)).toBeVisible();

    await demo.screenshot('login-page', 'InventoryPro login screen');

    // Fill email
    await narration.narrate(
      'First, enter your email address in the email field.',
      3000,
      'Type email'
    );
    await demo.fill(page.getByLabel(/email/i), 'cybergada@gmail.com', { typingSpeed: 80 });

    // Fill password
    await narration.narrate('Next, enter your password.', 3000, 'Type password');
    await demo.fill(page.getByLabel(/password/i), 'Qweasd145698@', { typingSpeed: 80 });

    // Click sign in
    await narration.narrate(
      'Click the Sign In button to access your dashboard.',
      3000,
      'Click Sign In button'
    );
    await demo.click(page.getByRole('button', { name: /sign in/i }));

    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 30000 });

    // Dashboard loaded
    await narration.narrate(
      'You are now viewing the main dashboard. Here you can see real-time key performance indicators for your business.',
      5000
    );

    await expect(page.getByText(/dashboard/i).first()).toBeVisible();
    await demo.screenshot('dashboard-view', 'Main dashboard after login');

    // Point out KPI cards
    await narration.narrate(
      'The dashboard displays important metrics like total products, stock levels, inventory value, and today\'s sales.',
      5000
    );

    // Show navigation
    await narration.narrate(
      'The sidebar navigation gives you access to all modules of the system, including products, inventory, sales, and reports.',
      5000
    );

    // Outro
    await narration.narrate(
      'You are now successfully logged in and ready to manage your inventory and sales. In the next videos, we will explore each module in detail.',
      6000
    );

    // Export narration script and subtitles
    const scriptJSON = narration.exportScript();
    const scriptSRT = narration.exportSRT();

    writeFileSync(`${outputDir}/login-script.json`, scriptJSON);
    writeFileSync(`${outputDir}/login-subtitles.srt`, scriptSRT);

    console.log(`\n✅ Demo completed! Files saved to ${outputDir}/`);
  });
});
