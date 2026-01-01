import { test, expect } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'fs';
import { NarrationHelper } from '../helpers/narration.helper';
import { DemoActions } from '../helpers/demo-actions.helper';
import { MouseTracker } from '../helpers/mouse-tracker.helper';
import { AnnotationHelper } from '../helpers/annotation.helper';

test.describe('Dashboard Overview Demo', () => {
  test('dashboard KPIs and navigation', async ({ page }) => {
    const narration = new NarrationHelper('Dashboard Overview');
    const demo = new DemoActions(page);
    const mouseTracker = new MouseTracker();
    const annotation = new AnnotationHelper();

    // Create output directory
    const outputDir = 'demo-recordings/02-dashboard';
    try {
      mkdirSync(outputDir, { recursive: true });
    } catch (e) {
      // Directory already exists
    }

    // Navigate to dashboard
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();

    // Inject interactive elements
    await mouseTracker.inject(page);

    // Intro
    await narration.narrate(
      'Welcome to the InventoryPro dashboard. This is the central hub where you can monitor your business performance at a glance.',
      5000
    );

    await demo.screenshot('dashboard-overview', 'Complete dashboard view');

    // KPI Cards Overview
    await narration.narrate(
      'The dashboard features key performance indicator cards that show real-time metrics for your business.',
      4000
    );

    // Total Products
    await narration.narrate(
      'The Total Products card shows the number of active products in your inventory system.',
      4000
    );

    // Total Stock
    await narration.narrate(
      'Total Stock displays the sum of all inventory items across all warehouses, measured in base units of measure.',
      5000
    );

    // Inventory Value
    await narration.narrate(
      'Inventory Value shows the total worth of your stock, calculated using weighted average cost pricing.',
      5000
    );

    // Today's Sales
    await narration.narrate(
      'Today\'s Sales displays revenue generated from point of sale transactions for the current day.',
      4000
    );

    // AR/AP
    await narration.narrate(
      'You can also monitor outstanding Accounts Receivable and Accounts Payable with aging information.',
      5000
    );

    // Charts section
    await narration.narrate(
      'Below the KPI cards, you will find visual charts showing sales trends, top-selling products, and low stock alerts.',
      5000
    );

    // Navigation sidebar
    await narration.narrate(
      'The left sidebar provides quick access to all system modules. Let\'s explore the main sections.',
      4000
    );

    // Show Products link
    await narration.narrate(
      'The Products section allows you to manage your product catalog with multiple units of measure.',
      4000
    );

    // Show Inventory link
    await narration.narrate(
      'Inventory management includes batch tracking, stock adjustments, and warehouse transfers.',
      4000
    );

    // Show POS link
    await narration.narrate(
      'The Point of Sale module processes customer transactions with multiple payment methods.',
      4000
    );

    // Show Reports link
    await narration.narrate(
      'Reports provide comprehensive insights into inventory, sales, and financial performance.',
      4000
    );

    // Branch selector
    await narration.narrate(
      'At the top of the screen, you can switch between different branch locations to view branch-specific data.',
      5000
    );

    // Outro
    await narration.narrate(
      'The dashboard gives you complete visibility into your business operations. In the following videos, we will dive deep into each module.',
      6000
    );

    // Export narration script and subtitles
    const scriptJSON = narration.exportScript();
    const scriptSRT = narration.exportSRT();

    writeFileSync(`${outputDir}/overview-script.json`, scriptJSON);
    writeFileSync(`${outputDir}/overview-subtitles.srt`, scriptSRT);

    console.log(`\n✅ Demo completed! Files saved to ${outputDir}/`);
  });
});
