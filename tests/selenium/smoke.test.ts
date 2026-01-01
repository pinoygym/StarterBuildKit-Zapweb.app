import { Builder, By, Key, until } from 'selenium-webdriver';
import { Options } from 'selenium-webdriver/chrome';

(async function smokeTest() {
    console.log('Starting Selenium smoke test...');

    // Setup Chrome options
    const options = new Options();
    // options.addArguments('--headless'); // Uncomment to run in headless mode

    let driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(options)
        .build();

    try {
        console.log('Navigating to homepage...');
        await driver.get('http://localhost:3002');

        console.log('Waiting for title...');
        await driver.wait(until.titleContains('InventoryPro'), 10000);

        const title = await driver.getTitle();
        console.log(`Page title is: ${title}`);

        if (title.includes('InventoryPro')) {
            console.log('SUCCESS: Title check passed!');
        } else {
            console.error('FAILURE: Title check failed!');
            process.exit(1);
        }

    } catch (e) {
        console.error('Test failed with error:', e);
        process.exit(1);
    } finally {
        await driver.quit();
        console.log('Driver quit.');
    }
})();
