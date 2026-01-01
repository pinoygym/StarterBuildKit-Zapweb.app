import { Builder, By, Key, until, WebDriver, WebElement } from 'selenium-webdriver';
import { Options } from 'selenium-webdriver/chrome';
import * as fs from 'fs';

const LOG_FILE = 'selenium-log.txt';
fs.writeFileSync(LOG_FILE, ''); // Clear log file

function log(message: string) {
    const timestamp = new Date().toISOString();
    const line = `[${timestamp}] ${message}\n`;
    console.log(message);
    fs.appendFileSync(LOG_FILE, line);
}

// Helper function to wait and click
async function click(driver: WebDriver, locator: By) {
    log(`Clicking ${locator}`);
    const element = await driver.wait(until.elementLocated(locator), 20000);
    await driver.wait(until.elementIsVisible(element), 20000);
    await element.click();
}

// Helper function to fill input
async function fill(driver: WebDriver, locator: By, text: string) {
    log(`Filling ${locator} with ${text}`);
    const element = await driver.wait(until.elementLocated(locator), 20000);
    await driver.wait(until.elementIsVisible(element), 20000);
    await element.clear();
    await element.sendKeys(text);
}

// Helper to select from shadcn Select
async function selectOption(driver: WebDriver, label: string, optionText?: string) {
    log(`Selecting option ${label} -> ${optionText || 'first option'}`);
    const trigger = await driver.wait(until.elementLocated(By.xpath(`//label[contains(text(), '${label}')]/..//button[@role='combobox']`)), 10000);
    await trigger.click();

    if (optionText) {
        const option = await driver.wait(until.elementLocated(By.xpath(`//div[@role='option']//span[contains(text(), '${optionText}')] | //div[@role='option'][contains(., '${optionText}')]`)), 10000);
        await option.click();
    } else {
        const option = await driver.wait(until.elementLocated(By.xpath(`//div[@role='option']`)), 10000);
        await option.click();
    }
    await driver.sleep(500);
}

(async function e2eFlowTest() {
    log('Starting Selenium E2E Flow Test with Alternate UOM...');

    const options = new Options();
    // Running in headed mode to debug
    options.addArguments('--headless');
    options.addArguments('--window-size=1920,1080');
    // Ignore certificate errors
    options.addArguments('--ignore-certificate-errors');
    options.addArguments('--allow-insecure-localhost');


    let driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(options)
        .build();

    try {
        // 1. Login
        log('1. Logging in...');
        await driver.get('http://localhost:3000/login');

        await fill(driver, By.id('email'), 'cybergada@gmail.com');
        await fill(driver, By.id('password'), 'Qweasd145698@');
        await click(driver, By.css('button[type="submit"]'));

        log('Waiting for dashboard redirection...');
        await driver.wait(until.urlContains('/dashboard'), 30000);
        log('   Login successful.');

        // 2. Use existing product from seed data
        const productName = 'Coca-Cola 8oz Bottle';
        const caseUOM = 'carton'; // Using 'carton' instead of 'case'
        const caseQuantity = '5'; // 5 cartons
        const conversionFactor = 24; // 1 carton = 24 bottles (from seed data)
        const expectedBottles = parseInt(caseQuantity) * conversionFactor; // 5 * 24 = 120 bottles

        log(`2. Using existing product: ${productName}`);
        log(`   UOM: ${caseUOM} (${conversionFactor} bottles per ${caseUOM})`);
        log(`   Will order ${caseQuantity} ${caseUOM}s = ${expectedBottles} bottles`);

        // 3. Create Purchase Order using CARTON UOM
        log(`3. Creating Purchase Order with ${caseQuantity} ${caseUOM}s...`);
        await driver.get('http://localhost:3000/purchase-orders/new');

        // Wait for page to fully load by checking for the form
        await driver.wait(until.elementLocated(By.xpath("//label[contains(text(), 'Supplier')]")), 15000);
        log('   Page loaded, checking for loading state...');

        // Wait for any loading skeleton to disappear
        try {
            const skeleton = await driver.findElement(By.css('[class*="skeleton"]'));
            await driver.wait(until.stalenessOf(skeleton), 10000);
            log('   Loading complete');
        } catch (e) {
            log('   No loading skeleton (already loaded)');
        }

        await driver.sleep(5000); // Give extra time for products to load via React Query

        log('   Selecting Supplier...');
        await selectOption(driver, 'Supplier');
        log('   Selecting Warehouse...');
        await selectOption(driver, 'Warehouse');
        log('   Selecting Branch...');
        await selectOption(driver, 'Branch');

        log('   Selecting Product...');
        // Find the Product field by its label, then navigate to the combobox button
        const productTrigger = await driver.wait(until.elementLocated(By.xpath("//label[contains(text(), 'Product')]/..//button[@role='combobox']")), 10000);
        await driver.executeScript("arguments[0].scrollIntoView(true);", productTrigger);
        await driver.sleep(500);
        await driver.wait(until.elementIsVisible(productTrigger), 10000);
        await productTrigger.click();

        // Wait for the popover to open
        await driver.sleep(3000);

        log(`   Searching for product: ${productName}...`);

        // Always search for the specific product
        const productSearchInput = await driver.wait(until.elementLocated(By.css("input[placeholder*='Search products']")), 5000);
        await productSearchInput.sendKeys("Coca");
        await driver.sleep(3000); // Wait for search results

        // Find the specific option
        const productOption = await driver.wait(until.elementLocated(By.xpath(`//div[@role='option'][contains(., '${productName}')] | //div[@role='option']//span[contains(text(), '${productName}')]`)), 10000);

        await driver.executeScript("arguments[0].scrollIntoView(true);", productOption);
        await driver.executeScript("arguments[0].click();", productOption);
        log('   Product selected successfully');

        await fill(driver, By.xpath("//label[contains(text(), 'Quantity')]/..//input"), caseQuantity);
        await driver.sleep(1000); // Wait for UOM dropdown to populate

        log(`   Selecting UOM (${caseUOM})...`);
        // UOM dropdown shows format like "carton (Avg: ₱X.XX)"
        const uomTrigger = await driver.wait(until.elementLocated(By.xpath("//label[contains(text(), 'UOM')]/..//button[@role='combobox']")), 10000);
        await uomTrigger.click();
        await driver.sleep(500);
        const uomOption = await driver.wait(until.elementLocated(By.xpath(`//div[@role='option'][contains(., '${caseUOM}')]`)), 15000);
        await uomOption.click();
        await driver.sleep(500);

        await fill(driver, By.xpath("//label[contains(text(), 'Unit Price')]/..//input"), '960');
        await click(driver, By.xpath("//button[contains(text(), 'Create Purchase Order')]"));

        await driver.wait(until.urlIs('http://localhost:3000/purchase-orders'), 15000);
        log('   Purchase Order created.');

        // 4. View Details, Submit, and Receive
        log('4. Opening PO Details...');
        await driver.wait(until.elementLocated(By.css('table tbody tr')), 10000);

        const firstRow = await driver.findElement(By.css('table tbody tr:first-child'));
        const actionsBtn = await firstRow.findElement(By.css("td:last-child button"));
        await driver.wait(until.elementIsVisible(actionsBtn), 5000);
        await actionsBtn.click();

        const viewOption = await driver.wait(until.elementLocated(By.xpath("//div[@role='menuitem'][contains(text(), 'View Details')]")), 5000);
        await viewOption.click();

        await driver.wait(until.urlContains('/purchase-orders/'), 10000);
        await driver.wait(until.elementLocated(By.xpath("//h1[contains(text(), 'Purchase Order PO-')]")), 10000);
        log('   On Purchase Order Details page.');

        log('   Submitting Order...');
        const submitBtn = await driver.wait(until.elementLocated(By.xpath("//button[contains(., 'Submit Order')]")), 5000);
        await submitBtn.click();

        const dialogSubmitBtn = await driver.wait(until.elementLocated(By.xpath("//div[@role='alertdialog']//button[contains(text(), 'Submit Order')]")), 5000);
        await dialogSubmitBtn.click();

        const receiveBtn = await driver.wait(until.elementLocated(By.xpath("//button[contains(., 'Receive')]")), 15000);
        await driver.wait(until.elementIsVisible(receiveBtn), 15000);
        log('   Order Submitted. Clicking Receive...');

        await driver.executeScript("arguments[0].click();", receiveBtn);

        await driver.wait(until.elementLocated(By.xpath("//*[contains(text(), 'Create Receiving Voucher')]")), 10000);

        await fill(driver, By.xpath("//label[contains(text(), 'Receiver Name')]/..//input"), 'Selenium Tester');
        await click(driver, By.xpath("//button[contains(text(), 'Create Receiving Voucher')]"));

        await driver.wait(until.stalenessOf(await driver.findElement(By.xpath("//*[contains(text(), 'Create Receiving Voucher')]"))), 10000);
        log('   Item received.');

        // 5. Verify Inventory (should show bottles, not cases)
        log('5. Verifying Inventory...');
        log(`   Expected: ${expectedBottles} bottles (${caseQuantity} cases × ${conversionFactor})`);
        await driver.sleep(2000); // Wait for backend processing
        await driver.get('http://localhost:3000/inventory');

        const productFilterTrigger = await driver.wait(until.elementLocated(By.xpath("//button[@role='combobox']//span[contains(text(), 'All Products')] | //button[@role='combobox'][.//span[contains(text(), 'All Products')]] | //div[contains(@class, 'flex')]//button[@role='combobox']")), 10000);
        await driver.executeScript("arguments[0].click();", productFilterTrigger);

        const productFilterOption = await driver.wait(until.elementLocated(By.xpath(`//div[@role='option'][contains(., '${productName}')]`)), 10000);
        await driver.executeScript("arguments[0].click();", productFilterOption);

        await driver.sleep(1000);

        const inventoryRow = await driver.wait(until.elementLocated(By.css('table tbody tr:first-child')), 5000);
        const qtyCell = await inventoryRow.findElement(By.css('td:nth-child(4)'));
        const qtyText = await qtyCell.getText();

        log(`   Inventory Quantity: ${qtyText}`);

        // Extract the numeric value from the text
        const qtyMatch = qtyText.match(/(\d+\.?\d*)/);
        if (qtyMatch) {
            const actualQty = parseFloat(qtyMatch[1]);
            if (actualQty === expectedBottles) {
                log(`✅ SUCCESS: Inventory correctly shows ${expectedBottles} bottles!`);
                log(`   (${caseQuantity} cases × ${conversionFactor} bottles/case = ${expectedBottles} bottles)`);
            } else {
                log(`❌ FAILURE: Expected ${expectedBottles} bottles, found ${actualQty}`);
                process.exit(1);
            }
        } else {
            log(`❌ FAILURE: Could not parse quantity from: ${qtyText}`);
            process.exit(1);
        }

    } catch (e) {
        log(`Test failed with error: ${e}`);
        const image = await driver.takeScreenshot();
        fs.writeFileSync('selenium-failure.png', image, 'base64');
        log('Screenshot saved to selenium-failure.png');
        process.exit(1);
    } finally {
        await driver.quit();
        log('Driver quit.');
    }
})();
