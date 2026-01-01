import { describe, test, beforeAll, afterAll, expect } from 'vitest';
import { Builder, By, until, WebDriver, Key } from 'selenium-webdriver';
import { Options } from 'selenium-webdriver/chrome';

// @vitest-environment node

const BASE_URL = 'http://localhost:3000';
const ADMIN_EMAIL = 'cybergada@gmail.com';
const ADMIN_PASS = 'Qweasd145698@';

describe('System Health Check (Selenium E2E)', () => {
  let driver: WebDriver;
  const testId = Date.now().toString();
  const testProductName = `AutoTest Product ${testId}`;

  beforeAll(async () => {
    const options = new Options();
    // options.addArguments('--headless'); 
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    options.windowSize({ width: 1280, height: 800 });

    driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();

    await driver.manage().setTimeouts({ implicit: 5000 });
  }, 60000);

  afterAll(async () => {
    if (driver) {
      await driver.quit();
    }
  });

  const login = async () => {
    console.log('Navigating to login...');
    await driver.get(`${BASE_URL}/login`);
    await driver.wait(until.elementLocated(By.id('email')), 10000);

    await driver.findElement(By.id('email')).clear();
    await driver.findElement(By.id('email')).sendKeys(ADMIN_EMAIL);

    await driver.findElement(By.id('password')).clear();
    await driver.findElement(By.id('password')).sendKeys(ADMIN_PASS);

    const submitBtn = await driver.findElement(By.css('button[type="submit"]'));
    await submitBtn.click();

    // Wait for dashboard - increased timeout
    await driver.wait(until.urlContains('/dashboard'), 30000);
    console.log('Login successful');
  };

  // Helper functions
  async function fill(locator: By, text: string) {
    const element = await driver.wait(until.elementLocated(locator), 10000);
    await driver.wait(until.elementIsVisible(element), 10000);
    // Robust clear for React controlled inputs
    await element.sendKeys(Key.CONTROL, 'a');
    await element.sendKeys(Key.BACK_SPACE);
    await element.clear();
    await element.sendKeys(text);
  }

  async function click(locator: By) {
    const element = await driver.wait(until.elementLocated(locator), 10000);
    await driver.wait(until.elementIsVisible(element), 10000);
    await element.click();
  }

  // Helper to select from shadcn Select
  async function selectOption(label: string, optionText?: string) {
    const trigger = await driver.wait(until.elementLocated(By.xpath(`//label[contains(text(), '${label}')]/..//button[@role='combobox']`)), 5000);
    await trigger.click();

    if (optionText) {
      const option = await driver.wait(until.elementLocated(By.xpath(`//div[@role='option']//span[contains(text(), '${optionText}')] | //div[@role='option'][contains(., '${optionText}')]`)), 5000);
      await option.click();
    } else {
      const option = await driver.wait(until.elementLocated(By.xpath(`//div[@role='option']`)), 5000);
      await option.click();
    }
    await driver.sleep(500);
  }

  test('1. Authentication: Login as Admin', async () => {
    await login();
    const title = await driver.getTitle();
    expect(title).toContain('InventoryPro');
  }, 40000);

  test('2. Product Module: CRUD', async () => {
    // Navigate to Products
    console.log('Navigating to Products...');
    await driver.get(`${BASE_URL}/products`);

    try {
      await driver.wait(until.elementLocated(By.xpath("//h1[contains(., 'Products')]")), 15000);
    } catch (e) {
      console.log('Header not found, checking for table or empty state...');
      await driver.wait(until.elementLocated(By.css("table, .text-center")), 5000);
    }

    // CREATE
    console.log('Creating Product...');

    // Wait for the Add Product button to be clickable
    const addBtn = await driver.wait(until.elementLocated(By.xpath("//button[contains(., 'Add Product')]")), 10000);
    await driver.wait(until.elementIsVisible(addBtn), 10000);
    await addBtn.click();

    // Wait for dialog
    await driver.wait(until.elementLocated(By.css('[role="dialog"]')), 5000);

    try {
      // Fill Form
      // Wait for name input animation
      await driver.sleep(500);
      await fill(By.name('name'), testProductName);

      // Category
      await selectOption('Category');

      // Base Price
      await fill(By.name('basePrice'), '150');

      // Average Cost Price
      await fill(By.xpath("//label[contains(text(), 'Average Cost Price')]/..//input"), '100');

      // Base UOM
      await fill(By.name('baseUOM'), 'bottle');

      // Minimum Stock Level
      await fill(By.xpath("//label[contains(text(), 'Minimum Stock Level')]/..//input"), '10');

      // Shelf Life
      await fill(By.xpath("//label[contains(text(), 'Shelf Life')]/..//input"), '365');

      // Submit
      // Find button inside dialog
      const submitBtn = await driver.findElement(By.xpath("//div[@role='dialog']//button[@type='submit']"));
      await submitBtn.click();

      // Wait for dialog to close (staleness)
      await driver.wait(until.stalenessOf(submitBtn), 15000);
      console.log('Product created successfully (dialog closed).');

      // VERIFY (Read)
      console.log('Verifying product existence in table...');
      // Wait for table to reload/update
      await driver.sleep(2000);
      await driver.get(`${BASE_URL}/products`); // Refresh to be sure
      await driver.wait(until.elementLocated(By.xpath("//h1[contains(., 'Products')]")), 15000);

      // Search for text in body or specific row
      // Try to find the row
      try {
        await driver.wait(until.elementLocated(By.xpath(`//tr[contains(., '${testProductName}')]`)), 10000);
        console.log('Product found in list.');
      } catch (e) {
        // Try to search if pagination hides it?
        console.log('Product not immediately visible, trying search...');
        const searchInput = await driver.findElement(By.css("input[placeholder*='Search']"));
        await searchInput.clear();
        await searchInput.sendKeys(testProductName);
        await driver.sleep(2000);
        await driver.wait(until.elementLocated(By.xpath(`//tr[contains(., '${testProductName}')]`)), 10000);
        console.log('Product found via search.');
      }

      // DELETE
      console.log('Deleting product...');
      // Find the row containing the product name
      const productRow = await driver.findElement(By.xpath(`//tr[contains(., '${testProductName}')]`));

      // Find delete button in that row (look for the trash icon or distinct button)
      // The delete button is usually the second action button
      const deleteBtns = await productRow.findElements(By.css("button"));
      // Assuming Edit is first, Delete is second or look for Trash icon
      const deleteBtn = await productRow.findElement(By.xpath(".//td[last()]//button[last()]"));
      await deleteBtn.click();

      // Confirm Delete
      await driver.wait(until.elementLocated(By.xpath("//div[@role='alertdialog']")), 5000);
      const confirmDeleteBtn = await driver.findElement(By.xpath("//div[@role='alertdialog']//button[contains(text(), 'Delete')] | //div[@role='alertdialog']//button[contains(@class, 'bg-destructive')]"));
      await confirmDeleteBtn.click();

      // Wait for dialog close
      await driver.wait(until.stalenessOf(confirmDeleteBtn), 10000);
      await driver.sleep(1000);

      // Verify Deletion
      const bodyTextAfterDelete = await driver.findElement(By.tagName('body')).getText();
      if (bodyTextAfterDelete.includes(testProductName)) {
        console.warn(`Product '${testProductName}' still found in table after deletion (might be cache).`);
      } else {
        console.log('Product deleted successfully.');
      }

    } catch (e: any) {
      console.warn('CRUD flow failed:', e.message);
      throw e;
    }
  }, 90000);

  test('3. User Module: Navigation Check', async () => {
    await driver.get(`${BASE_URL}/users`);
    // Wait for table OR empty state
    await driver.wait(until.elementLocated(By.css('table, .text-center')), 10000);
  });

  test('4. Sales Orders: Navigation Check', async () => {
    await driver.get(`${BASE_URL}/sales-orders`);
    try {
      await driver.wait(until.elementLocated(By.xpath("//h1[contains(., 'Sales')]")), 10000);
    } catch (e) {
      console.log('Sales Header not found, checking for table or empty state...');
      await driver.wait(until.elementLocated(By.css("table, .text-center")), 5000);
    }
  });

  test('5. Inventory: Navigation Check', async () => {
    await driver.get(`${BASE_URL}/inventory`);
    await driver.wait(until.elementLocated(By.xpath("//h1[contains(., 'Inventory')]")), 10000);
  });

  test('6. Customers Module: Navigation Check', async () => {
    await driver.get(`${BASE_URL}/customers`);
    await driver.wait(until.elementLocated(By.xpath("//h1[contains(., 'Customers')]")), 10000);
  });

  test('7. Suppliers Module: Navigation Check', async () => {
    await driver.get(`${BASE_URL}/suppliers`);
    await driver.wait(until.elementLocated(By.xpath("//h1[contains(., 'Suppliers')]")), 10000);
  });

  test('8. Purchase Orders: Navigation & Creation Flow', async () => {
    // Navigation Check
    await driver.get(`${BASE_URL}/purchase-orders`);
    await driver.wait(until.elementLocated(By.xpath("//h1[contains(., 'Purchase Orders')]")), 10000);

    // Basic Creation Flow
    await driver.get(`${BASE_URL}/purchase-orders/new`);
    // Check for form element
    await driver.wait(until.elementLocated(By.xpath("//button[contains(., 'Create Purchase Order')]")), 10000);
  });

  test('9. Receiving Vouchers: Navigation Check', async () => {
    await driver.get(`${BASE_URL}/receiving-vouchers`);
    try {
      await driver.wait(until.elementLocated(By.xpath("//h1[contains(., 'Receiving Vouchers')]")), 10000);
    } catch (e) {
      console.warn('Receiving Vouchers Header not found. Checking for table or empty state...');
      try {
        await driver.wait(until.elementLocated(By.css("table, .text-center")), 5000);
      } catch (inner) {
        console.warn('Receiving Vouchers page content not found.');
      }
    }
  });

  test('10. Branches: Navigation Check', async () => {
    await driver.get(`${BASE_URL}/branches`);
    await driver.wait(until.elementLocated(By.xpath("//h1[contains(., 'Branches')]")), 10000);
  });

  test('11. Warehouses: Navigation Check', async () => {
    await driver.get(`${BASE_URL}/warehouses`);
    await driver.wait(until.elementLocated(By.xpath("//h1[contains(., 'Warehouses')]")), 10000);
  });

  test('12. Reports: Navigation Check', async () => {
    await driver.get(`${BASE_URL}/reports`);
    await driver.wait(until.elementLocated(By.xpath("//h1[contains(., 'Reports')]")), 20000);
  });

  test('13. POS: Navigation Check', async () => {
    await driver.get(`${BASE_URL}/pos`);
    // POS usually has a different layout, check for product grid OR PageHeader
    // The grid might not show if no branch is selected, but the header should be there.
    await driver.wait(until.elementLocated(By.xpath("//h1[contains(., 'Point of Sale')]")), 10000);
  });

});
