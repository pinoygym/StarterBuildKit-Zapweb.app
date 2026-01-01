/**
 * Extended API Testing - Transaction, Financial, and Reporting Endpoints
 * Tests the remaining 42+ endpoints
 */

const BASE_URL = process.env.APP_URL || 'http://localhost:3000';
let authToken = null;
let testResults = {
  passed: [],
  failed: [],
  skipped: [],
  total: 0
};

// Test context - populated from initial data
const testData = {
  branchId: null,
  warehouseId: null,
  productId: null,
  customerId: null,
  supplierId: null,
  poId: null,
  rvId: null,
  soId: null,
  posId: null,
  arId: null,
  apId: null,
  expenseId: null
};

// Helper functions
async function apiRequest(method, endpoint, body = null, skipAuth = false) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
  };

  if (!skipAuth && authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const options = {
    method,
    headers,
  };

  if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    const data = await response.json();
    return {
      success: response.ok,
      status: response.status,
      data,
      error: !response.ok ? data.error || data.message || 'Request failed' : null
    };
  } catch (error) {
    return {
      success: false,
      status: 0,
      data: null,
      error: error.message
    };
  }
}

function logTest(name, passed, details = '') {
  testResults.total++;
  if (passed) {
    testResults.passed.push({ name, details });
    console.log(`✅ PASS: ${name}`);
  } else {
    testResults.failed.push({ name, details });
    console.log(`❌ FAIL: ${name} - ${details}`);
  }
}

function skipTest(name, reason) {
  testResults.total++;
  testResults.skipped.push({ name, reason });
  console.log(`⚠️  SKIP: ${name} - ${reason}`);
}

// Initialize: Login and get test data IDs
async function initialize() {
  console.log('🔧 Initializing test environment...\n');

  // Login
  const loginResult = await apiRequest('POST', '/api/auth/login', {
    email: 'cybergada@gmail.com',
    password: 'Qweasd145698@'
  }, true);

  if (loginResult.success && loginResult.data.token) {
    authToken = loginResult.data.token;
    console.log('✅ Logged in successfully\n');
  } else {
    console.error('❌ Login failed - Cannot proceed with tests');
    process.exit(1);
  }

  // Get branches
  const branchesResult = await apiRequest('GET', '/api/branches');
  if (branchesResult.success && branchesResult.data.data?.length > 0) {
    testData.branchId = branchesResult.data.data[0].id;
    console.log(`✅ Branch ID: ${testData.branchId}`);
  }

  // Get warehouses
  const warehousesResult = await apiRequest('GET', '/api/warehouses');
  if (warehousesResult.success && warehousesResult.data.data?.length > 0) {
    testData.warehouseId = warehousesResult.data.data[0].id;
    console.log(`✅ Warehouse ID: ${testData.warehouseId}`);
  }

  // Get products
  const productsResult = await apiRequest('GET', '/api/products');
  if (productsResult.success && productsResult.data.data?.length > 0) {
    testData.productId = productsResult.data.data[0].id;
    console.log(`✅ Product ID: ${testData.productId}`);
  }

  // Get customers
  const customersResult = await apiRequest('GET', '/api/customers');
  if (customersResult.success && customersResult.data.data?.length > 0) {
    testData.customerId = customersResult.data.data[0].id;
    console.log(`✅ Customer ID: ${testData.customerId}`);
  }

  // Get suppliers
  const suppliersResult = await apiRequest('GET', '/api/suppliers');
  if (suppliersResult.success && suppliersResult.data.data?.length > 0) {
    testData.supplierId = suppliersResult.data.data[0].id;
    console.log(`✅ Supplier ID: ${testData.supplierId}`);
  }

  console.log('\n');
}

// ============================================================================
// PURCHASE ORDER TESTS (7 endpoints)
// ============================================================================
async function testPurchaseOrders() {
  console.log('\n📦 TESTING PURCHASE ORDER ENDPOINTS (7)...\n');

  if (!testData.supplierId || !testData.warehouseId || !testData.branchId || !testData.productId) {
    skipTest('Purchase Order tests', 'Missing required data');
    return;
  }

  // 1. GET /api/purchase-orders
  const poListResult = await apiRequest('GET', '/api/purchase-orders');
  logTest('GET /api/purchase-orders', poListResult.success, poListResult.error);

  // 2. POST /api/purchase-orders
  const createPOResult = await apiRequest('POST', '/api/purchase-orders', {
    supplierId: testData.supplierId,
    warehouseId: testData.warehouseId,
    branchId: testData.branchId,
    expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    items: [
      {
        productId: testData.productId,
        quantity: 100,
        unitPrice: 50
      }
    ],
    notes: 'Test PO created by automated tests'
  });
  logTest('POST /api/purchase-orders', createPOResult.success, createPOResult.error);
  testData.poId = createPOResult.data?.data?.id;

  if (testData.poId) {
    // 3. GET /api/purchase-orders/[id]
    const getPOResult = await apiRequest('GET', `/api/purchase-orders/${testData.poId}`);
    logTest('GET /api/purchase-orders/[id]', getPOResult.success, getPOResult.error);

    // 4. PUT /api/purchase-orders/[id]
    const updatePOResult = await apiRequest('PUT', `/api/purchase-orders/${testData.poId}`, {
      notes: 'Updated test PO'
    });
    logTest('PUT /api/purchase-orders/[id]', updatePOResult.success, updatePOResult.error);

    // 5. GET /api/purchase-orders/[id]/receiving-vouchers
    const rvListResult = await apiRequest('GET', `/api/purchase-orders/${testData.poId}/receiving-vouchers`);
    logTest('GET /api/purchase-orders/[id]/receiving-vouchers', rvListResult.success, rvListResult.error);

    // 6. POST /api/purchase-orders/[id]/receive (will create RV)
    // Skipped - complex operation that creates inventory

    // 7. POST /api/purchase-orders/[id]/cancel
    const cancelPOResult = await apiRequest('POST', `/api/purchase-orders/${testData.poId}/cancel`, {
      reason: 'Test cancellation'
    });
    logTest('POST /api/purchase-orders/[id]/cancel', cancelPOResult.success, cancelPOResult.error);
  } else {
    skipTest('GET /api/purchase-orders/[id]', 'PO creation failed');
    skipTest('PUT /api/purchase-orders/[id]', 'PO creation failed');
    skipTest('GET /api/purchase-orders/[id]/receiving-vouchers', 'PO creation failed');
    skipTest('POST /api/purchase-orders/[id]/cancel', 'PO creation failed');
  }

  skipTest('POST /api/purchase-orders/[id]/receive', 'Complex operation - requires proper receiving flow');
}

// ============================================================================
// RECEIVING VOUCHER TESTS (3 endpoints)
// ============================================================================
async function testReceivingVouchers() {
  console.log('\n📥 TESTING RECEIVING VOUCHER ENDPOINTS (3)...\n');

  // 1. GET /api/receiving-vouchers
  const rvListResult = await apiRequest('GET', '/api/receiving-vouchers');
  logTest('GET /api/receiving-vouchers', rvListResult.success, rvListResult.error);

  // 2 & 3 - Create and Get RV require valid PO
  if (!testData.poId) {
    skipTest('POST /api/receiving-vouchers', 'No valid PO available');
    skipTest('GET /api/receiving-vouchers/[id]', 'No valid PO available');
  }
}

// ============================================================================
// SALES ORDER TESTS (7 endpoints)
// ============================================================================
async function testSalesOrders() {
  console.log('\n📋 TESTING SALES ORDER ENDPOINTS (7)...\n');

  if (!testData.warehouseId || !testData.branchId || !testData.productId) {
    skipTest('Sales Order tests', 'Missing required data');
    return;
  }

  // 1. GET /api/sales-orders
  const soListResult = await apiRequest('GET', '/api/sales-orders');
  logTest('GET /api/sales-orders', soListResult.success, soListResult.error);

  // 2. POST /api/sales-orders
  const createSOResult = await apiRequest('POST', '/api/sales-orders', {
    customerName: 'Test Customer',
    customerPhone: '+639171234567',
    customerEmail: 'test@example.com',
    deliveryAddress: 'Test Address',
    warehouseId: testData.warehouseId,
    branchId: testData.branchId,
    deliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    items: [
      {
        productId: testData.productId,
        quantity: 10,
        uom: 'piece',
        unitPrice: 100
      }
    ]
  });
  logTest('POST /api/sales-orders', createSOResult.success, createSOResult.error);
  testData.soId = createSOResult.data?.data?.id;

  if (testData.soId) {
    // 3. GET /api/sales-orders/[id]
    const getSOResult = await apiRequest('GET', `/api/sales-orders/${testData.soId}`);
    logTest('GET /api/sales-orders/[id]', getSOResult.success, getSOResult.error);

    // 4. PUT /api/sales-orders/[id]
    const updateSOResult = await apiRequest('PUT', `/api/sales-orders/${testData.soId}`, {
      customerName: 'Updated Customer'
    });
    logTest('PUT /api/sales-orders/[id]', updateSOResult.success, updateSOResult.error);

    // 5. POST /api/sales-orders/[id]/cancel
    const cancelSOResult = await apiRequest('POST', `/api/sales-orders/${testData.soId}/cancel`, {
      reason: 'Test cancellation'
    });
    logTest('POST /api/sales-orders/[id]/cancel', cancelSOResult.success, cancelSOResult.error);

    // 6. DELETE /api/sales-orders/[id] (only for draft)
    skipTest('DELETE /api/sales-orders/[id]', 'Already cancelled');
  } else {
    skipTest('GET /api/sales-orders/[id]', 'SO creation failed');
    skipTest('PUT /api/sales-orders/[id]', 'SO creation failed');
    skipTest('POST /api/sales-orders/[id]/cancel', 'SO creation failed');
    skipTest('DELETE /api/sales-orders/[id]', 'SO creation failed');
  }

  // 7. GET /api/sales-orders/pending
  const pendingSOResult = await apiRequest('GET', '/api/sales-orders/pending');
  logTest('GET /api/sales-orders/pending', pendingSOResult.success, pendingSOResult.error);
}

// ============================================================================
// POS TESTS (6 endpoints)
// ============================================================================
async function testPOS() {
  console.log('\n💰 TESTING POS ENDPOINTS (6)...\n');

  if (!testData.warehouseId || !testData.branchId) {
    skipTest('POS tests', 'Missing required data');
    return;
  }

  // 1. GET /api/pos/products
  const posProductsResult = await apiRequest('GET', `/api/pos/products?warehouseId=${testData.warehouseId}`);
  logTest('GET /api/pos/products', posProductsResult.success, posProductsResult.error);

  // 2. GET /api/pos/sales
  const posSalesResult = await apiRequest('GET', '/api/pos/sales');
  logTest('GET /api/pos/sales', posSalesResult.success, posSalesResult.error);

  // 3. POST /api/pos/sales (requires inventory)
  skipTest('POST /api/pos/sales', 'Requires sufficient inventory');

  // 4. GET /api/pos/sales/[id]
  if (posSalesResult.success && posSalesResult.data.data?.length > 0) {
    const saleId = posSalesResult.data.data[0].id;
    const getPOSSaleResult = await apiRequest('GET', `/api/pos/sales/${saleId}`);
    logTest('GET /api/pos/sales/[id]', getPOSSaleResult.success, getPOSSaleResult.error);
  } else {
    skipTest('GET /api/pos/sales/[id]', 'No POS sales found');
  }

  // 5. GET /api/pos/sales/today-summary
  const todaySummaryResult = await apiRequest('GET', '/api/pos/sales/today-summary');
  logTest('GET /api/pos/sales/today-summary', todaySummaryResult.success, todaySummaryResult.error);

  // 6. GET /api/pos/pending-orders
  const pendingOrdersResult = await apiRequest('GET', '/api/pos/pending-orders');
  logTest('GET /api/pos/pending-orders', pendingOrdersResult.success, pendingOrdersResult.error);
}

// ============================================================================
// ACCOUNTS RECEIVABLE TESTS (7 endpoints)
// ============================================================================
async function testAccountsReceivable() {
  console.log('\n💵 TESTING ACCOUNTS RECEIVABLE ENDPOINTS (7)...\n');

  // 1. GET /api/ar
  const arListResult = await apiRequest('GET', '/api/ar');
  logTest('GET /api/ar', arListResult.success, arListResult.error);

  // 2. POST /api/ar
  if (testData.branchId && testData.customerId) {
    const createARResult = await apiRequest('POST', '/api/ar', {
      branchId: testData.branchId,
      customerId: testData.customerId,
      customerName: 'Test Customer',
      totalAmount: 1000,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    });
    logTest('POST /api/ar', createARResult.success, createARResult.error);
    testData.arId = createARResult.data?.data?.id;
  } else {
    skipTest('POST /api/ar', 'Missing branch or customer ID');
  }

  // 3. GET /api/ar/[id]
  if (testData.arId || (arListResult.success && arListResult.data.data?.length > 0)) {
    const arId = testData.arId || arListResult.data.data[0].id;
    const getARResult = await apiRequest('GET', `/api/ar/${arId}`);
    logTest('GET /api/ar/[id]', getARResult.success, getARResult.error);

    // 4. POST /api/ar/[id]/payment
    const paymentResult = await apiRequest('POST', `/api/ar/${arId}/payment`, {
      amount: 100,
      paymentMethod: 'Cash',
      paymentDate: new Date().toISOString()
    });
    logTest('POST /api/ar/[id]/payment', paymentResult.success, paymentResult.error);

    // 5. DELETE /api/ar/[id]
    if (testData.arId) {
      const deleteARResult = await apiRequest('DELETE', `/api/ar/${arId}`);
      logTest('DELETE /api/ar/[id]', deleteARResult.success, deleteARResult.error);
    } else {
      skipTest('DELETE /api/ar/[id]', 'Not deleting existing AR');
    }
  } else {
    skipTest('GET /api/ar/[id]', 'No AR records found');
    skipTest('POST /api/ar/[id]/payment', 'No AR records found');
    skipTest('DELETE /api/ar/[id]', 'No AR records found');
  }

  // 6. POST /api/ar/payment (generic)
  skipTest('POST /api/ar/payment', 'Duplicate of [id]/payment');

  // 7. GET /api/ar/aging-report
  const agingReportResult = await apiRequest('GET', '/api/ar/aging-report');
  logTest('GET /api/ar/aging-report', agingReportResult.success, agingReportResult.error);
}

// ============================================================================
// ACCOUNTS PAYABLE TESTS (7 endpoints)
// ============================================================================
async function testAccountsPayable() {
  console.log('\n💸 TESTING ACCOUNTS PAYABLE ENDPOINTS (7)...\n');

  // 1. GET /api/ap
  const apListResult = await apiRequest('GET', '/api/ap');
  logTest('GET /api/ap', apListResult.success, apListResult.error);

  // 2. POST /api/ap
  if (testData.branchId && testData.supplierId) {
    const createAPResult = await apiRequest('POST', '/api/ap', {
      branchId: testData.branchId,
      supplierId: testData.supplierId,
      totalAmount: 5000,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    });
    logTest('POST /api/ap', createAPResult.success, createAPResult.error);
    testData.apId = createAPResult.data?.data?.id;
  } else {
    skipTest('POST /api/ap', 'Missing branch or supplier ID');
  }

  // 3. GET /api/ap/[id]
  if (testData.apId || (apListResult.success && apListResult.data.data?.length > 0)) {
    const apId = testData.apId || apListResult.data.data[0].id;
    const getAPResult = await apiRequest('GET', `/api/ap/${apId}`);
    logTest('GET /api/ap/[id]', getAPResult.success, getAPResult.error);

    // 4. POST /api/ap/[id]/payment
    const paymentResult = await apiRequest('POST', `/api/ap/${apId}/payment`, {
      amount: 500,
      paymentMethod: 'Bank Transfer',
      paymentDate: new Date().toISOString()
    });
    logTest('POST /api/ap/[id]/payment', paymentResult.success, paymentResult.error);

    // 5. DELETE /api/ap/[id]
    if (testData.apId) {
      const deleteAPResult = await apiRequest('DELETE', `/api/ap/${apId}`);
      logTest('DELETE /api/ap/[id]', deleteAPResult.success, deleteAPResult.error);
    } else {
      skipTest('DELETE /api/ap/[id]', 'Not deleting existing AP');
    }
  } else {
    skipTest('GET /api/ap/[id]', 'No AP records found');
    skipTest('POST /api/ap/[id]/payment', 'No AP records found');
    skipTest('DELETE /api/ap/[id]', 'No AP records found');
  }

  // 6. POST /api/ap/payment (generic)
  skipTest('POST /api/ap/payment', 'Duplicate of [id]/payment');

  // 7. GET /api/ap/aging-report
  const agingReportResult = await apiRequest('GET', '/api/ap/aging-report');
  logTest('GET /api/ap/aging-report', agingReportResult.success, agingReportResult.error);
}

// ============================================================================
// EXPENSE TESTS (7 endpoints)
// ============================================================================
async function testExpenses() {
  console.log('\n💳 TESTING EXPENSE ENDPOINTS (7)...\n');

  if (!testData.branchId) {
    skipTest('Expense tests', 'Missing branch ID');
    return;
  }

  // 1. GET /api/expenses
  const expensesResult = await apiRequest('GET', '/api/expenses');
  logTest('GET /api/expenses', expensesResult.success, expensesResult.error);

  // 2. POST /api/expenses
  const createExpenseResult = await apiRequest('POST', '/api/expenses', {
    branchId: testData.branchId,
    expenseDate: new Date().toISOString(),
    category: 'Office Supplies',
    amount: 500,
    description: 'Test expense',
    paymentMethod: 'Cash',
    vendor: 'Test Vendor'
  });
  logTest('POST /api/expenses', createExpenseResult.success, createExpenseResult.error);
  testData.expenseId = createExpenseResult.data?.data?.id;

  if (testData.expenseId) {
    // 3. GET /api/expenses/[id]
    const getExpenseResult = await apiRequest('GET', `/api/expenses/${testData.expenseId}`);
    logTest('GET /api/expenses/[id]', getExpenseResult.success, getExpenseResult.error);

    // 4. PUT /api/expenses/[id]
    const updateExpenseResult = await apiRequest('PUT', `/api/expenses/${testData.expenseId}`, {
      description: 'Updated test expense'
    });
    logTest('PUT /api/expenses/[id]', updateExpenseResult.success, updateExpenseResult.error);

    // 5. DELETE /api/expenses/[id]
    const deleteExpenseResult = await apiRequest('DELETE', `/api/expenses/${testData.expenseId}`);
    logTest('DELETE /api/expenses/[id]', deleteExpenseResult.success, deleteExpenseResult.error);
  } else {
    skipTest('GET /api/expenses/[id]', 'Expense creation failed');
    skipTest('PUT /api/expenses/[id]', 'Expense creation failed');
    skipTest('DELETE /api/expenses/[id]', 'Expense creation failed');
  }

  // 6. GET /api/expenses/reports/by-category
  const byCategoryResult = await apiRequest('GET', '/api/expenses/reports/by-category');
  logTest('GET /api/expenses/reports/by-category', byCategoryResult.success, byCategoryResult.error);

  // 7. GET /api/expenses/reports/by-vendor
  const byVendorResult = await apiRequest('GET', '/api/expenses/reports/by-vendor');
  logTest('GET /api/expenses/reports/by-vendor', byVendorResult.success, byVendorResult.error);
}

// ============================================================================
// DASHBOARD & ALERTS TESTS (6 endpoints)
// ============================================================================
async function testDashboardAndAlerts() {
  console.log('\n📊 TESTING DASHBOARD & ALERTS ENDPOINTS (6)...\n');

  // Dashboard (4)
  const kpisResult = await apiRequest('GET', '/api/dashboard/kpis');
  logTest('GET /api/dashboard/kpis', kpisResult.success, kpisResult.error);

  const topProductsResult = await apiRequest('GET', '/api/dashboard/top-products?limit=10');
  logTest('GET /api/dashboard/top-products', topProductsResult.success, topProductsResult.error);

  const warehouseUtilResult = await apiRequest('GET', '/api/dashboard/warehouse-utilization');
  logTest('GET /api/dashboard/warehouse-utilization', warehouseUtilResult.success, warehouseUtilResult.error);

  const branchCompResult = await apiRequest('GET', '/api/dashboard/branch-comparison');
  logTest('GET /api/dashboard/branch-comparison', branchCompResult.success, branchCompResult.error);

  // Alerts (2)
  const alertsResult = await apiRequest('GET', '/api/alerts');
  logTest('GET /api/alerts', alertsResult.success, alertsResult.error);

  const alertCountsResult = await apiRequest('GET', '/api/alerts/counts');
  logTest('GET /api/alerts/counts', alertCountsResult.success, alertCountsResult.error);
}

// ============================================================================
// REPORTING TESTS (11 endpoints)
// ============================================================================
async function testReporting() {
  console.log('\n📈 TESTING REPORTING ENDPOINTS (11)...\n');

  const today = new Date().toISOString().split('T')[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // 1. Sales report
  const salesReportResult = await apiRequest('GET', `/api/reports/sales?startDate=${thirtyDaysAgo}&endDate=${today}`);
  logTest('GET /api/reports/sales', salesReportResult.success, salesReportResult.error);

  // 2. Profit & Loss
  const profitLossResult = await apiRequest('GET', `/api/reports/profit-loss?startDate=${thirtyDaysAgo}&endDate=${today}`);
  logTest('GET /api/reports/profit-loss', profitLossResult.success, profitLossResult.error);

  // 3. Cash Flow
  const cashFlowResult = await apiRequest('GET', `/api/reports/cash-flow?startDate=${thirtyDaysAgo}&endDate=${today}`);
  logTest('GET /api/reports/cash-flow', cashFlowResult.success, cashFlowResult.error);

  // 4. Balance Sheet
  const balanceSheetResult = await apiRequest('GET', `/api/reports/balance-sheet?asOfDate=${today}`);
  logTest('GET /api/reports/balance-sheet', balanceSheetResult.success, balanceSheetResult.error);

  // 5. Inventory Value
  const inventoryValueResult = await apiRequest('GET', '/api/reports/inventory-value');
  logTest('GET /api/reports/inventory-value', inventoryValueResult.success, inventoryValueResult.error);

  // 6. Stock Levels
  const stockLevelsResult = await apiRequest('GET', '/api/reports/stock-levels');
  logTest('GET /api/reports/stock-levels', stockLevelsResult.success, stockLevelsResult.error);

  // 7. Best Sellers
  const bestSellersResult = await apiRequest('GET', `/api/reports/best-sellers?startDate=${thirtyDaysAgo}&endDate=${today}&limit=10`);
  logTest('GET /api/reports/best-sellers', bestSellersResult.success, bestSellersResult.error);

  // 8. Discount/Promotion Analytics (GET)
  const promoAnalyticsResult = await apiRequest('GET', '/api/reports/discount-promotion-analytics');
  logTest('GET /api/reports/discount-promotion-analytics', promoAnalyticsResult.success, promoAnalyticsResult.error);

  // 9. Discount/Promotion Analytics (POST)
  skipTest('POST /api/reports/discount-promotion-analytics', 'Requires specific data structure');

  // 10. Employee Performance (GET)
  const empPerfResult = await apiRequest('GET', `/api/reports/employee-performance?startDate=${thirtyDaysAgo}&endDate=${today}`);
  logTest('GET /api/reports/employee-performance', empPerfResult.success, empPerfResult.error);

  // 11. Employee Performance (POST)
  skipTest('POST /api/reports/employee-performance', 'Requires specific performance data');

  // 12. Receiving Variance
  const receivingVarianceResult = await apiRequest('GET', `/api/reports/receiving-variance?startDate=${thirtyDaysAgo}&endDate=${today}`);
  logTest('GET /api/reports/receiving-variance', receivingVarianceResult.success, receivingVarianceResult.error);
}

// ============================================================================
// MAIN TEST EXECUTION
// ============================================================================
async function runAllTests() {
  console.log('='.repeat(80));
  console.log('🚀 TESTING REMAINING API ENDPOINTS (TRANSACTIONS, FINANCIAL, REPORTING)');
  console.log('='.repeat(80));
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log(`⏰ Started at: ${new Date().toISOString()}\n`);

  try {
    await initialize();
    await testPurchaseOrders();
    await testReceivingVouchers();
    await testSalesOrders();
    await testPOS();
    await testAccountsReceivable();
    await testAccountsPayable();
    await testExpenses();
    await testDashboardAndAlerts();
    await testReporting();

  } catch (error) {
    console.error('\n💥 FATAL ERROR:', error.message);
    console.error(error.stack);
  }

  // Print summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(80));
  console.log(`✅ Passed:  ${testResults.passed.length}`);
  console.log(`❌ Failed:  ${testResults.failed.length}`);
  console.log(`⚠️  Skipped: ${testResults.skipped.length}`);
  console.log(`📈 Total:   ${testResults.total}`);
  console.log(`📊 Success Rate: ${((testResults.passed.length / testResults.total) * 100).toFixed(2)}%`);

  if (testResults.failed.length > 0) {
    console.log('\n❌ FAILED TESTS:');
    testResults.failed.forEach(({ name, details }) => {
      console.log(`   - ${name}: ${details}`);
    });
  }

  console.log('\n⏰ Completed at:', new Date().toISOString());
  console.log('='.repeat(80));

  // Exit with appropriate code
  process.exit(testResults.failed.length > 0 ? 1 : 0);
}

// Run tests
runAllTests();
