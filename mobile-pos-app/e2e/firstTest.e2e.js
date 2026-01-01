describe('Mobile POS App E2E Tests', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  describe('Authentication Flow', () => {
    it('should display login screen on app launch', async () => {
      await expect(element(by.text('Mobile POS System'))).toBeVisible();
      await expect(element(by.text('Sign in to continue'))).toBeVisible();
      await expect(element(by.id('login-email-input'))).toBeVisible();
      await expect(element(by.id('login-password-input'))).toBeVisible();
      await expect(element(by.id('login-button'))).toBeVisible();
    });

    it('should show validation errors for empty fields', async () => {
      await element(by.id('login-button')).tap();
      
      await expect(element(by.text('Please enter your email'))).toBeVisible();
      await expect(element(by.text('Please enter your password'))).toBeVisible();
    });

    it('should show validation error for invalid email', async () => {
      await element(by.id('login-email-input')).typeText('invalid-email');
      await element(by.id('login-password-input')).typeText('password123');
      await element(by.id('login-button')).tap();
      
      await expect(element(by.text('Please enter a valid email address'))).toBeVisible();
    });

    it('should successfully login with valid credentials', async () => {
      await element(by.id('login-email-input')).typeText('admin@example.com');
      await element(by.id('login-password-input')).typeText('password123');
      await element(by.id('login-button')).tap();
      
      // Wait for navigation to dashboard
      await waitFor(element(by.text('Dashboard'))).toBeVisible().withTimeout(5000);
      await expect(element(by.text('Dashboard'))).toBeVisible();
    });
  });

  describe('Navigation Flow', () => {
    beforeEach(async () => {
      // Login first
      await element(by.id('login-email-input')).typeText('admin@example.com');
      await element(by.id('login-password-input')).typeText('password123');
      await element(by.id('login-button')).tap();
      await waitFor(element(by.text('Dashboard'))).toBeVisible().withTimeout(5000);
    });

    it('should navigate to Point of Sale screen', async () => {
      await element(by.text('Point of Sale')).tap();
      await expect(element(by.text('Point of Sale'))).toBeVisible();
      await expect(element(by.id('pos-screen'))).toBeVisible();
    });

    it('should navigate to Products screen', async () => {
      await element(by.text('Products')).tap();
      await expect(element(by.text('Products'))).toBeVisible();
      await expect(element(by.id('products-screen'))).toBeVisible();
    });

    it('should navigate to Inventory screen', async () => {
      await element(by.text('Inventory')).tap();
      await expect(element(by.text('Inventory'))).toBeVisible();
      await expect(element(by.id('inventory-screen'))).toBeVisible();
    });

    it('should navigate to Reports screen', async () => {
      await element(by.text('Reports')).tap();
      await expect(element(by.text('Reports'))).toBeVisible();
      await expect(element(by.id('reports-screen'))).toBeVisible();
    });
  });

  describe('Point of Sale Flow', () => {
    beforeEach(async () => {
      // Login and navigate to POS
      await element(by.id('login-email-input')).typeText('admin@example.com');
      await element(by.id('login-password-input')).typeText('password123');
      await element(by.id('login-button')).tap();
      await waitFor(element(by.text('Dashboard'))).toBeVisible().withTimeout(5000);
      await element(by.text('Point of Sale')).tap();
      await waitFor(element(by.id('pos-screen'))).toBeVisible().withTimeout(5000);
    });

    it('should add product to cart', async () => {
      // Search for a product
      await element(by.id('product-search-input')).typeText('Coca Cola');
      await expect(element(by.text('Coca Cola'))).toBeVisible();
      
      // Add product to cart
      await element(by.id('product-coca-cola-add')).tap();
      
      // Verify cart shows the item
      await expect(element(by.text('Cart (1)'))).toBeVisible();
      await expect(element(by.text('Coca Cola'))).toBeVisible();
    });

    it('should complete a sale transaction', async () => {
      // Add product to cart
      await element(by.id('product-search-input')).typeText('Coca Cola');
      await element(by.id('product-coca-cola-add')).tap();
      
      // Enter payment amount
      await element(by.id('payment-amount-input')).typeText('100');
      
      // Complete sale
      await element(by.id('complete-sale-button')).tap();
      
      // Verify sale completion
      await waitFor(element(by.text('Sale completed successfully'))).toBeVisible().withTimeout(5000);
      await expect(element(by.text('Receipt'))).toBeVisible();
    });

    it('should handle insufficient payment', async () => {
      // Add product to cart
      await element(by.id('product-search-input')).typeText('Coca Cola');
      await element(by.id('product-coca-cola-add')).tap();
      
      // Enter insufficient payment amount
      await element(by.id('payment-amount-input')).typeText('10');
      
      // Try to complete sale
      await element(by.id('complete-sale-button')).tap();
      
      // Should show error message
      await expect(element(by.text('Payment amount is insufficient'))).toBeVisible();
    });
  });

  describe('Product Management Flow', () => {
    beforeEach(async () => {
      // Login and navigate to Products
      await element(by.id('login-email-input')).typeText('admin@example.com');
      await element(by.id('login-password-input')).typeText('password123');
      await element(by.id('login-button')).tap();
      await waitFor(element(by.text('Dashboard'))).toBeVisible().withTimeout(5000);
      await element(by.text('Products')).tap();
      await waitFor(element(by.id('products-screen'))).toBeVisible().withTimeout(5000);
    });

    it('should search for products', async () => {
      await element(by.id('product-search-input')).typeText('Coca Cola');
      await expect(element(by.text('Coca Cola'))).toBeVisible();
    });

    it('should filter products by category', async () => {
      await element(by.id('category-filter-button')).tap();
      await element(by.text('Beverages')).tap();
      
      // Should show only beverage products
      await expect(element(by.text('Coca Cola'))).toBeVisible();
    });

    it('should add new product', async () => {
      await element(by.id('add-product-fab')).tap();
      
      // Fill product form
      await element(by.id('product-name-input')).typeText('New Product');
      await element(by.id('product-price-input')).typeText('9.99');
      await element(by.id('product-category-input')).typeText('Beverages');
      
      // Save product
      await element(by.id('save-product-button')).tap();
      
      // Verify product was added
      await waitFor(element(by.text('Product added successfully'))).toBeVisible().withTimeout(5000);
    });
  });

  describe('Inventory Management Flow', () => {
    beforeEach(async () => {
      // Login and navigate to Inventory
      await element(by.id('login-email-input')).typeText('admin@example.com');
      await element(by.id('login-password-input')).typeText('password123');
      await element(by.id('login-button')).tap();
      await waitFor(element(by.text('Dashboard'))).toBeVisible().withTimeout(5000);
      await element(by.text('Inventory')).tap();
      await waitFor(element(by.id('inventory-screen'))).toBeVisible().withTimeout(5000);
    });

    it('should view inventory levels', async () => {
      await expect(element(by.text('Inventory Levels'))).toBeVisible();
      await expect(element(by.id('inventory-list'))).toBeVisible();
    });

    it('should add stock to product', async () => {
      // Find a product in inventory
      await element(by.id('inventory-item-coca-cola')).tap();
      
      // Add stock
      await element(by.id('add-stock-button')).tap();
      await element(by.id('stock-quantity-input')).typeText('50');
      await element(by.id('confirm-add-stock-button')).tap();
      
      // Verify stock was added
      await waitFor(element(by.text('Stock added successfully'))).toBeVisible().withTimeout(5000);
    });

    it('should adjust stock levels', async () => {
      // Find a product in inventory
      await element(by.id('inventory-item-coca-cola')).tap();
      
      // Adjust stock
      await element(by.id('adjust-stock-button')).tap();
      await element(by.id('stock-quantity-input')).typeText('25');
      await element(by.id('confirm-adjust-stock-button')).tap();
      
      // Verify stock was adjusted
      await waitFor(element(by.text('Stock adjusted successfully'))).toBeVisible().withTimeout(5000);
    });
  });

  describe('Reports Flow', () => {
    beforeEach(async () => {
      // Login and navigate to Reports
      await element(by.id('login-email-input')).typeText('admin@example.com');
      await element(by.id('login-password-input')).typeText('password123');
      await element(by.id('login-button')).tap();
      await waitFor(element(by.text('Dashboard'))).toBeVisible().withTimeout(5000);
      await element(by.text('Reports')).tap();
      await waitFor(element(by.id('reports-screen'))).toBeVisible().withTimeout(5000);
    });

    it('should view sales summary', async () => {
      await expect(element(by.text('Sales Summary'))).toBeVisible();
      await expect(element(by.id('sales-summary-card'))).toBeVisible();
    });

    it('should filter reports by date range', async () => {
      // Open date range picker
      await element(by.id('date-range-button')).tap();
      
      // Select start date
      await element(by.id('start-date-input')).tap();
      await element(by.text('1')).tap(); // Select 1st of month
      
      // Select end date
      await element(by.id('end-date-input')).tap();
      await element(by.text('31')).tap(); // Select 31st of month
      
      // Apply filter
      await element(by.id('apply-date-filter-button')).tap();
      
      // Verify reports were filtered
      await expect(element(by.text('Filtered Reports'))).toBeVisible();
    });

    it('should view top products report', async () => {
      await element(by.id('top-products-tab')).tap();
      await expect(element(by.text('Top Products'))).toBeVisible();
      await expect(element(by.id('top-products-list'))).toBeVisible();
    });

    it('should view hourly sales chart', async () => {
      await element(by.id('hourly-sales-tab')).tap();
      await expect(element(by.text('Hourly Sales'))).toBeVisible();
      await expect(element(by.id('hourly-sales-chart'))).toBeVisible();
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      // Simulate network error by using invalid credentials
      await element(by.id('login-email-input')).typeText('invalid@example.com');
      await element(by.id('login-password-input')).typeText('wrongpassword');
      await element(by.id('login-button')).tap();
      
      // Should show error message
      await expect(element(by.text('Network error. Please try again.'))).toBeVisible();
    });

    it('should handle server errors gracefully', async () => {
      // Login with valid credentials
      await element(by.id('login-email-input')).typeText('admin@example.com');
      await element(by.id('login-password-input')).typeText('password123');
      await element(by.id('login-button')).tap();
      await waitFor(element(by.text('Dashboard'))).toBeVisible().withTimeout(5000);
      
      // Navigate to POS and try to complete sale without products
      await element(by.text('Point of Sale')).tap();
      await element(by.id('complete-sale-button')).tap();
      
      // Should show validation error
      await expect(element(by.text('Please add products to cart'))).toBeVisible();
    });
  });

  describe('Offline Functionality', () => {
    it('should work offline and sync when back online', async () => {
      // Login
      await element(by.id('login-email-input')).typeText('admin@example.com');
      await element(by.id('login-password-input')).typeText('password123');
      await element(by.id('login-button')).tap();
      await waitFor(element(by.text('Dashboard'))).toBeVisible().withTimeout(5000);
      
      // Simulate offline mode
      await device.disableSynchronization();
      
      // Navigate to POS and make a sale
      await element(by.text('Point of Sale')).tap();
      await element(by.id('product-search-input')).typeText('Coca Cola');
      await element(by.id('product-coca-cola-add')).tap();
      await element(by.id('payment-amount-input')).typeText('100');
      await element(by.id('complete-sale-button')).tap();
      
      // Should work offline
      await expect(element(by.text('Sale completed'))).toBeVisible();
      
      // Simulate back online
      await device.enableSynchronization();
      
      // Navigate to reports to verify sync
      await element(by.text('Reports')).tap();
      await expect(element(by.text('Recent sale synced'))).toBeVisible();
    });
  });
});