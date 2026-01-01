# Selenium Tests

This directory contains Selenium WebDriver tests for the InventoryPro application.

## Setup

The necessary dependencies are already installed:
- `selenium-webdriver`
- `@types/selenium-webdriver`
- `tsx` (for running TypeScript files)

## Running Tests

To run the smoke test:

```bash
npm run test:selenium
```

## Adding New Tests

You can create new test files in this directory.
To run a specific test file, use:

```bash
npx tsx tests/selenium/your-test-file.ts
```

## Configuration

The current setup uses `selenium-webdriver`'s automatic driver management. It will detect your installed Chrome browser and download the appropriate driver.

If you need to configure headless mode or other options, you can modify the `tests/selenium/smoke.test.ts` file or create a shared setup file.

Example of headless configuration:

```typescript
const options = new Options();
options.addArguments('--headless');
// ...
```
