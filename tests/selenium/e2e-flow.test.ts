import { Builder, By, Key, until, WebDriver, WebElement } from 'selenium-webdriver';
import { Options } from 'selenium-webdriver/chrome';

// Helper function to wait and click
async function click(driver: WebDriver, locator: By) {
    const element = await driver.wait(until.elementLocated(locator), 10000);
    await driver.wait(until.elementIsVisible(element), 10000);
    await element.click();
}

// Helper function to fill input
async function fill(driver: WebDriver, locator: By, text: string) {
    const element = await driver.wait(until.elementLocated(locator), 10000);
    await driver.wait(until.elementIsVisible(element), 10000);
    await element.clear();
    await element.sendKeys(text);
}

// Helper to select from shadcn Select
async function selectOption(driver: WebDriver, label: string, optionText?: string) {
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

(async function e2eFlowTest() {
    console.log('Starting Selenium E2E Flow Test with Alternate UOM...');

    const options = new Options();
    // options.addArguments('--headless');
    options.addArguments('--window-size=1920,1080');

    let driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(options)
        .build();

    const productName = `Selenium Product ${Date.now()}`;
    const caseQuantity = '5'; // 5 cases
    const conversionFactor = 12; // 1 case = 12 bottles
    const expectedBottles = parseInt(caseQuantity) * conversionFactor; // 5 * 12 = 60 bottles

    try {
        // 1. Login
        console.log('1. Logging in...');
        await driver.get('http://localhost:3000/login');

        await fill(driver, By.id('email'), 'cybergada@gmail.com');
        await fill(driver, By.id('password'), 'Qweasd145698@');
        await click(driver, By.css('button[type="submit"]'));

        await driver.wait(until.urlContains('/dashboard'), 30000);
        console.log('   Login successful.');

        // 2. Create Product
        console.log(`2. Creating Product: ${productName}...`);
        await driver.get('http://localhost:3000/products');
        await click(driver, By.xpath("//button[contains(., 'Add Product')]"));

        await driver.wait(until.elementLocated(By.xpath("//h2[contains(text(), 'Create Product')]")), 5000);

        await fill(driver, By.xpath("//label[contains(text(), 'Product Name')]/..//input"), productName);
        await selectOption(driver, 'Category');
        await fill(driver, By.xpath("//label[contains(text(), 'Base Price')]/..//input"), '100');
        await fill(driver, By.xpath("//label[contains(text(), 'Average Cost Price')]/..//input"), '80');
        await fill(driver, By.xpath("//label[contains(text(), 'Base UOM')]/..//input"), 'bottle');
        await fill(driver, By.xpath("//label[contains(text(), 'Minimum Stock Level')]/..//input"), '10');
        await fill(driver, By.xpath("//label[contains(text(), 'Shelf Life')]/..//input"), '365');

        await click(driver, By.xpath("//button[contains(text(), 'Create')]"));
        await driver.wait(until.stalenessOf(await driver.findElement(By.xpath("//h2[contains(text(), 'Create Product')]"))), 10000);
        console.log('   Product created.');

        // 2b. Edit Product to Add Alternate UOM
        console.log('2b. Adding Alternate UOM (case = 12 bottles)...');
        await driver.sleep(1500); // Wait for table to update

        // Find the product row
        const productRow = await driver.wait(until.elementLocated(By.xpath(`//tr[contains(., '${productName}')]`)), 5000);

        // Find the Actions column (last td) and click the first button (Edit button)
        const actionsCell = await productRow.findElement(By.xpath(".//td[last()]"));
        const editButton = await actionsCell.findElement(By.xpath(".//button[1]")); // First button is Edit
        await driver.executeScript("arguments[0].scrollIntoView(true);", editButton);
        await driver.sleep(300);
        await driver.executeScript("arguments[0].click();", editButton);

        // Wait for Edit dialog
        await driver.wait(until.elementLocated(By.xpath("//h2[contains(text(), 'Edit Product')]")), 5000);

        // Click Add UOM button
        console.log('   Clicking Add UOM button...');
        await driver.wait(until.stalenessOf(await driver.findElement(By.xpath("//h2[contains(text(), 'Edit Product')]"))), 10000);
        console.log('   Alternate UOM added.');

        // 3. Create Purchase Order using CASE UOM
        console.log(`3. Creating Purchase Order with ${caseQuantity} cases...`);
        await driver.navigate().refresh();
        await driver.get('http://localhost:3000/purchase-orders/new');

        console.log('   Selecting Supplier...');
        await selectOption(driver, 'Supplier');
        console.log('   Selecting Warehouse...');
        await selectOption(driver, 'Warehouse');
        console.log('   Selecting Branch...');
        await selectOption(driver, 'Branch');

        console.log('   Selecting Product...');
        const productTrigger = await driver.wait(until.elementLocated(By.xpath("//button[.//span[contains(text(), 'Select product')]]")), 10000);
        await driver.executeScript("arguments[0].scrollIntoView(true);", productTrigger);
        await driver.sleep(500);
        await driver.wait(until.elementIsVisible(productTrigger), 10000);
        await productTrigger.click();

        await driver.wait(until.elementLocated(By.xpath("//div[@role='option']")), 5000);
        const productOption = await driver.wait(until.elementLocated(By.xpath(`//div[@role='option'][contains(., '${productName}')]`)), 10000);
        await driver.executeScript("arguments[0].scrollIntoView(true);", productOption);
        await productOption.click();

        await fill(driver, By.xpath("//label[contains(text(), 'Quantity')]/..//input"), caseQuantity);

        console.log('   Selecting UOM (case)...');
        await selectOption(driver, 'UOM', 'case');

        await fill(driver, By.xpath("//label[contains(text(), 'Unit Price')]/..//input"), '960');
        await click(driver, By.xpath("//button[contains(text(), 'Create Purchase Order')]"));

        await driver.wait(until.urlIs('http://localhost:3000/purchase-orders'), 15000);
        console.log('   Purchase Order created.');

        // 4. View Details, Submit, and Receive
        console.log('4. Opening PO Details...');
        await driver.wait(until.elementLocated(By.css('table tbody tr')), 10000);

        const firstRow = await driver.findElement(By.css('table tbody tr:first-child'));
        const actionsBtn = await firstRow.findElement(By.css("td:last-child button"));
        await driver.wait(until.elementIsVisible(actionsBtn), 5000);
        await actionsBtn.click();

        const viewOption = await driver.wait(until.elementLocated(By.xpath("//div[@role='menuitem'][contains(text(), 'View Details')]")), 5000);
        await viewOption.click();

        await driver.wait(until.urlContains('/purchase-orders/'), 10000);
        await driver.wait(until.elementLocated(By.xpath("//h1[contains(text(), 'Purchase Order PO-')]")), 10000);
        console.log('   On Purchase Order Details page.');

        console.log('   Submitting Order...');
        const submitBtn = await driver.wait(until.elementLocated(By.xpath("//button[contains(., 'Submit Order')]")), 5000);
        await submitBtn.click();

        const dialogSubmitBtn = await driver.wait(until.elementLocated(By.xpath("//div[@role='alertdialog']//button[contains(text(), 'Submit Order')]")), 5000);
        await dialogSubmitBtn.click();

        const receiveBtn = await driver.wait(until.elementLocated(By.xpath("//button[contains(., 'Receive')]")), 10000);
        await driver.wait(until.elementIsVisible(receiveBtn), 5000);
        console.log('   Order Submitted. Clicking Receive...');

        await driver.executeScript("arguments[0].click();", receiveBtn);

        await driver.wait(until.elementLocated(By.xpath("//h2[contains(text(), 'Create Receiving Voucher')]")), 10000);

        await fill(driver, By.xpath("//label[contains(text(), 'Receiver Name')]/..//input"), 'Selenium Tester');
        await click(driver, By.xpath("//button[contains(text(), 'Create Receiving Voucher')]"));

        await driver.wait(until.stalenessOf(await driver.findElement(By.xpath("//h2[contains(text(), 'Create Receiving Voucher')]"))), 10000);
        console.log('   Item received.');

        // 5. Verify Inventory (should show bottles, not cases)
        console.log('5. Verifying Inventory...');
        console.log(`   Expected: ${expectedBottles} bottles (${caseQuantity} cases × ${conversionFactor})`);
        await driver.get('http://localhost:3000/inventory');

        const productFilterTrigger = await driver.wait(until.elementLocated(By.xpath("//button[@role='combobox']//span[contains(text(), 'All Products')] | //button[@role='combobox'][.//span[contains(text(), 'All Products')]]")), 5000);
        await driver.executeScript("arguments[0].click();", productFilterTrigger);

        const productFilterOption = await driver.wait(until.elementLocated(By.xpath(`//div[@role='option'][contains(., '${productName}')]`)), 5000);
        await driver.executeScript("arguments[0].click();", productFilterOption);

        await driver.sleep(1000);

        const inventoryRow = await driver.wait(until.elementLocated(By.css('table tbody tr:first-child')), 5000);
        const qtyCell = await inventoryRow.findElement(By.css('td:nth-child(4)'));
        const qtyText = await qtyCell.getText();

        console.log(`   Inventory Quantity: ${qtyText}`);

        // Extract the numeric value from the text
        const qtyMatch = qtyText.match(/(\d+\.?\d*)/);
        if (qtyMatch) {
            const actualQty = parseFloat(qtyMatch[1]);
            if (actualQty === expectedBottles) {
                console.log(`✅ SUCCESS: Inventory correctly shows ${expectedBottles} bottles!`);
                console.log(`   (${caseQuantity} cases × ${conversionFactor} bottles/case = ${expectedBottles} bottles)`);
            } else {
                console.error(`❌ FAILURE: Expected ${expectedBottles} bottles, found ${actualQty}`);
                process.exit(1);
            }
        } else {
            console.error(`❌ FAILURE: Could not parse quantity from: ${qtyText}`);
            process.exit(1);
        }

    } catch (e) {
        console.error('Test failed with error:', e);
        const image = await driver.takeScreenshot();
        const fs = require('fs');
        fs.writeFileSync('selenium-failure.png', image, 'base64');
        console.log('Screenshot saved to selenium-failure.png');
        process.exit(1);
    } finally {
        await driver.quit();
        console.log('Driver quit.');
    }
})();
