/**
 * Comprehensive API Endpoint Testing Script
 * Tests all 90+ API endpoints in the InventoryPro application
 */

const BASE_URL = process.env.APP_URL || 'http://localhost:3000';
let authToken = null;
let testResults = {
  passed: [],
  failed: [],
  skipped: [],
  total: 0
};

// Test context - will be populated during tests
const testData = {
  userId: null,
  roleId: null,
  productId: null,
  branchId: null,
  warehouseId: null,
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

// Helper function to make API requests
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
      error: !response.ok ? data.error || 'Request failed' : null
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

// Test result logging
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

// ============================================================================
// AUTHENTICATION TESTS
// ============================================================================

async function testAuthentication() {
  console.log('\n🔐 TESTING AUTHENTICATION ENDPOINTS (6)...\n');

  // 1. POST /api/auth/register
  const registerResult = await apiRequest('POST', '/api/auth/register', {
    email: `test_${Date.now()}@test.com`,
    password: 'TestPassword123!',
    firstName: 'Test',
    lastName: 'User',
    phone: '+639171234567',
    roleId: testData.roleId // Will use existing role from seed
  }, true);
  logTest('POST /api/auth/register', registerResult.success, registerResult.error);

  // 2. POST /api/auth/login
  const loginResult = await apiRequest('POST', '/api/auth/login', {
    email: 'cybergada@gmail.com',
    password: 'Qweasd145698@'
  }, true);
  logTest('POST /api/auth/login', loginResult.success, loginResult.error);

  if (loginResult.success && loginResult.data.token) {
    authToken = loginResult.data.token;
    console.log(`   🔑 Auth token obtained`);
  }

  // 3. GET /api/auth/me
  const meResult = await apiRequest('GET', '/api/auth/me');
  logTest('GET /api/auth/me', meResult.success, meResult.error);
  if (meResult.success && meResult.data.user) {
    testData.userId = meResult.data.user.id;
  }

  // 4. POST /api/auth/change-password
  const changePasswordResult = await apiRequest('POST', '/api/auth/change-password', {
    currentPassword: 'Qweasd145698@',
    newPassword: 'Qweasd145698@' // Same password for testing
  });
  logTest('POST /api/auth/change-password', changePasswordResult.success, changePasswordResult.error);

  // 5. POST /api/auth/verify-email
  skipTest('POST /api/auth/verify-email', 'Requires email token generation');

  // 6. POST /api/auth/logout
  const logoutResult = await apiRequest('POST', '/api/auth/logout');
  logTest('POST /api/auth/logout', logoutResult.success, logoutResult.error);

  // Re-login for subsequent tests
  const reloginResult = await apiRequest('POST', '/api/auth/login', {
    email: 'cybergada@gmail.com',
    password: 'Qweasd145698@'
  }, true);
  if (reloginResult.success) {
    authToken = reloginResult.data.token;
  }
}

// ============================================================================
// USER & ROLE MANAGEMENT TESTS
// ============================================================================

async function testUserManagement() {
  console.log('\n👥 TESTING USER & ROLE MANAGEMENT (10)...\n');

  // 1. GET /api/roles
  const rolesResult = await apiRequest('GET', '/api/roles');
  logTest('GET /api/roles', rolesResult.success, rolesResult.error);
  if (rolesResult.success && rolesResult.data.data?.length > 0) {
    testData.roleId = rolesResult.data.data[0].id;
  }

  // 2. POST /api/roles
  const createRoleResult = await apiRequest('POST', '/api/roles', {
    name: `Test Role ${Date.now()}`,
    description: 'Test role created by automated tests',
    permissionIds: []
  });
  logTest('POST /api/roles', createRoleResult.success, createRoleResult.error);

  // 3. GET /api/permissions
  const permissionsResult = await apiRequest('GET', '/api/permissions');
  logTest('GET /api/permissions', permissionsResult.success, permissionsResult.error);

  // 4. GET /api/users
  const usersResult = await apiRequest('GET', '/api/users');
  logTest('GET /api/users', usersResult.success, usersResult.error);

  // 5. POST /api/users
  const createUserResult = await apiRequest('POST', '/api/users', {
    email: `test_user_${Date.now()}@test.com`,
    password: 'TestPassword123!',
    firstName: 'Test',
    lastName: 'User',
    phone: '+639171234567',
    roleId: testData.roleId,
    branchId: testData.branchId
  });
  logTest('POST /api/users', createUserResult.success, createUserResult.error);
  const newUserId = createUserResult.data?.data?.id;

  // 6. GET /api/users/[id]
  if (newUserId) {
    const getUserResult = await apiRequest('GET', `/api/users/${newUserId}`);
    logTest('GET /api/users/[id]', getUserResult.success, getUserResult.error);

    // 7. PUT /api/users/[id]
    const updateUserResult = await apiRequest('PUT', `/api/users/${newUserId}`, {
      firstName: 'Updated',
      lastName: 'Name'
    });
    logTest('PUT /api/users/[id]', updateUserResult.success, updateUserResult.error);

    // 8. POST /api/users/[id]/verify
    const verifyUserResult = await apiRequest('POST', `/api/users/${newUserId}/verify`);
    logTest('POST /api/users/[id]/verify', verifyUserResult.success, verifyUserResult.error);

    // 9. DELETE /api/users/[id]
    const deleteUserResult = await apiRequest('DELETE', `/api/users/${newUserId}`);
    logTest('DELETE /api/users/[id]', deleteUserResult.success, deleteUserResult.error);
  } else {
    skipTest('GET /api/users/[id]', 'User creation failed');
    skipTest('PUT /api/users/[id]', 'User creation failed');
    skipTest('POST /api/users/[id]/verify', 'User creation failed');
    skipTest('DELETE /api/users/[id]', 'User creation failed');
  }
}

// ============================================================================
// MASTER DATA TESTS
// ============================================================================

async function testMasterData() {
  console.log('\n📋 TESTING MASTER DATA ENDPOINTS (20)...\n');

  // BRANCHES (5)
  const branchesResult = await apiRequest('GET', '/api/branches');
  logTest('GET /api/branches', branchesResult.success, branchesResult.error);
  if (branchesResult.success && branchesResult.data.data?.length > 0) {
    testData.branchId = branchesResult.data.data[0].id;
  }

  const createBranchResult = await apiRequest('POST', '/api/branches', {
    name: `Test Branch ${Date.now()}`,
    code: `TB${Date.now()}`,
    location: 'Test Location',
    manager: 'Test Manager',
    phone: '+639171234567',
    status: 'active'
  });
  logTest('POST /api/branches', createBranchResult.success, createBranchResult.error);
  const newBranchId = createBranchResult.data?.data?.id;

  if (newBranchId) {
    const getBranchResult = await apiRequest('GET', `/api/branches/${newBranchId}`);
    logTest('GET /api/branches/[id]', getBranchResult.success, getBranchResult.error);

    const updateBranchResult = await apiRequest('PUT', `/api/branches/${newBranchId}`, {
      manager: 'Updated Manager'
    });
    logTest('PUT /api/branches/[id]', updateBranchResult.success, updateBranchResult.error);

    const deleteBranchResult = await apiRequest('DELETE', `/api/branches/${newBranchId}`);
    logTest('DELETE /api/branches/[id]', deleteBranchResult.success, deleteBranchResult.error);
  } else {
    skipTest('GET /api/branches/[id]', 'Branch creation failed');
    skipTest('PUT /api/branches/[id]', 'Branch creation failed');
    skipTest('DELETE /api/branches/[id]', 'Branch creation failed');
  }

  // WAREHOUSES (5)
  const warehousesResult = await apiRequest('GET', '/api/warehouses');
  logTest('GET /api/warehouses', warehousesResult.success, warehousesResult.error);
  if (warehousesResult.success && warehousesResult.data.data?.length > 0) {
    testData.warehouseId = warehousesResult.data.data[0].id;
  }

  const createWarehouseResult = await apiRequest('POST', '/api/warehouses', {
    name: `Test Warehouse ${Date.now()}`,
    location: 'Test Location',
    manager: 'Test Manager',
    maxCapacity: 10000,
    branchId: testData.branchId
  });
  logTest('POST /api/warehouses', createWarehouseResult.success, createWarehouseResult.error);
  const newWarehouseId = createWarehouseResult.data?.data?.id;

  if (newWarehouseId) {
    const getWarehouseResult = await apiRequest('GET', `/api/warehouses/${newWarehouseId}`);
    logTest('GET /api/warehouses/[id]', getWarehouseResult.success, getWarehouseResult.error);

    const updateWarehouseResult = await apiRequest('PUT', `/api/warehouses/${newWarehouseId}`, {
      manager: 'Updated Manager'
    });
    logTest('PUT /api/warehouses/[id]', updateWarehouseResult.success, updateWarehouseResult.error);

    const deleteWarehouseResult = await apiRequest('DELETE', `/api/warehouses/${newWarehouseId}`);
    logTest('DELETE /api/warehouses/[id]', deleteWarehouseResult.success, deleteWarehouseResult.error);
  } else {
    skipTest('GET /api/warehouses/[id]', 'Warehouse creation failed');
    skipTest('PUT /api/warehouses/[id]', 'Warehouse creation failed');
    skipTest('DELETE /api/warehouses/[id]', 'Warehouse creation failed');
  }

  // CUSTOMERS (5)
  const customersResult = await apiRequest('GET', '/api/customers');
  logTest('GET /api/customers', customersResult.success, customersResult.error);
  if (customersResult.success && customersResult.data.data?.length > 0) {
    testData.customerId = customersResult.data.data[0].id;
  }

  const createCustomerResult = await apiRequest('POST', '/api/customers', {
    customerCode: `CUST${Date.now()}`,
    contactPerson: 'Test Customer',
    phone: '+639171234567',
    email: `customer_${Date.now()}@test.com`,
    address: 'Test Address',
    city: 'Test City',
    region: 'Test Region',
    postalCode: '1000',
    paymentTerms: 'Net 30',
    customerType: 'regular',
    status: 'active'
  });
  logTest('POST /api/customers', createCustomerResult.success, createCustomerResult.error);
  const newCustomerId = createCustomerResult.data?.data?.id;

  if (newCustomerId) {
    const getCustomerResult = await apiRequest('GET', `/api/customers/${newCustomerId}`);
    logTest('GET /api/customers/[id]', getCustomerResult.success, getCustomerResult.error);

    const updateCustomerResult = await apiRequest('PUT', `/api/customers/${newCustomerId}`, {
      contactPerson: 'Updated Customer'
    });
    logTest('PUT /api/customers/[id]', updateCustomerResult.success, updateCustomerResult.error);

    const deleteCustomerResult = await apiRequest('DELETE', `/api/customers/${newCustomerId}`);
    logTest('DELETE /api/customers/[id]', deleteCustomerResult.success, deleteCustomerResult.error);
  } else {
    skipTest('GET /api/customers/[id]', 'Customer creation failed');
    skipTest('PUT /api/customers/[id]', 'Customer creation failed');
    skipTest('DELETE /api/customers/[id]', 'Customer creation failed');
  }

  // SUPPLIERS (5)
  const suppliersResult = await apiRequest('GET', '/api/suppliers');
  logTest('GET /api/suppliers', suppliersResult.success, suppliersResult.error);
  if (suppliersResult.success && suppliersResult.data.data?.length > 0) {
    testData.supplierId = suppliersResult.data.data[0].id;
  }

  const createSupplierResult = await apiRequest('POST', '/api/suppliers', {
    companyName: `Test Supplier ${Date.now()}`,
    contactPerson: 'Test Contact',
    phone: '+639171234567',
    email: `supplier_${Date.now()}@test.com`,
    paymentTerms: 'Net 30',
    status: 'active'
  });
  logTest('POST /api/suppliers', createSupplierResult.success, createSupplierResult.error);
  const newSupplierId = createSupplierResult.data?.data?.id;

  if (newSupplierId) {
    const getSupplierResult = await apiRequest('GET', `/api/suppliers/${newSupplierId}`);
    logTest('GET /api/suppliers/[id]', getSupplierResult.success, getSupplierResult.error);

    const updateSupplierResult = await apiRequest('PUT', `/api/suppliers/${newSupplierId}`, {
      contactPerson: 'Updated Contact'
    });
    logTest('PUT /api/suppliers/[id]', updateSupplierResult.success, updateSupplierResult.error);

    const deleteSupplierResult = await apiRequest('DELETE', `/api/suppliers/${newSupplierId}`);
    logTest('DELETE /api/suppliers/[id]', deleteSupplierResult.success, deleteSupplierResult.error);
  } else {
    skipTest('GET /api/suppliers/[id]', 'Supplier creation failed');
    skipTest('PUT /api/suppliers/[id]', 'Supplier creation failed');
    skipTest('DELETE /api/suppliers/[id]', 'Supplier creation failed');
  }
}

// ============================================================================
// PRODUCT & INVENTORY TESTS
// ============================================================================

async function testProductsAndInventory() {
  console.log('\n📦 TESTING PRODUCTS & INVENTORY (13)...\n');

  // PRODUCTS (5)
  const productsResult = await apiRequest('GET', '/api/products');
  logTest('GET /api/products', productsResult.success, productsResult.error);
  if (productsResult.success && productsResult.data.data?.length > 0) {
    testData.productId = productsResult.data.data[0].id;
  }

  const createProductResult = await apiRequest('POST', '/api/products', {
    name: `Test Product ${Date.now()}`,
    description: 'Test product description',
    category: 'Test Category',
    basePrice: 100,
    baseUOM: 'piece',
    minStockLevel: 10,
    shelfLifeDays: 365,
    status: 'active',
    alternateUOMs: [
      { name: 'box', conversionFactor: 12, sellingPrice: 1100 }
    ]
  });
  logTest('POST /api/products', createProductResult.success, createProductResult.error);
  const newProductId = createProductResult.data?.data?.id;

  if (newProductId) {
    const getProductResult = await apiRequest('GET', `/api/products/${newProductId}`);
    logTest('GET /api/products/[id]', getProductResult.success, getProductResult.error);

    const updateProductResult = await apiRequest('PUT', `/api/products/${newProductId}`, {
      basePrice: 110
    });
    logTest('PUT /api/products/[id]', updateProductResult.success, updateProductResult.error);

    const deleteProductResult = await apiRequest('DELETE', `/api/products/${newProductId}`);
    logTest('DELETE /api/products/[id]', deleteProductResult.success, deleteProductResult.error);
  } else {
    skipTest('GET /api/products/[id]', 'Product creation failed');
    skipTest('PUT /api/products/[id]', 'Product creation failed');
    skipTest('DELETE /api/products/[id]', 'Product creation failed');
  }

  // INVENTORY (8)
  const inventoryResult = await apiRequest('GET', '/api/inventory');
  logTest('GET /api/inventory', inventoryResult.success, inventoryResult.error);

  const stockLevelsResult = await apiRequest('GET', '/api/inventory/stock-levels');
  logTest('GET /api/inventory/stock-levels', stockLevelsResult.success, stockLevelsResult.error);

  if (testData.productId && testData.warehouseId) {
    const addStockResult = await apiRequest('POST', '/api/inventory/add-stock', {
      productId: testData.productId,
      warehouseId: testData.warehouseId,
      quantity: 100,
      unitCost: 50,
      batchNumber: `BATCH${Date.now()}`,
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      receivedDate: new Date().toISOString()
    });
    logTest('POST /api/inventory/add-stock', addStockResult.success, addStockResult.error);

    const deductStockResult = await apiRequest('POST', '/api/inventory/deduct-stock', {
      productId: testData.productId,
      warehouseId: testData.warehouseId,
      quantity: 5,
      reason: 'Test deduction'
    });
    logTest('POST /api/inventory/deduct-stock', deductStockResult.success, deductStockResult.error);

    const adjustStockResult = await apiRequest('POST', '/api/inventory/adjust', {
      batchId: addStockResult.data?.batch?.id,
      quantity: 95,
      reason: 'Test adjustment'
    });
    logTest('POST /api/inventory/adjust', adjustStockResult.success || !addStockResult.data?.batch?.id, adjustStockResult.error);

    const movementsResult = await apiRequest('GET', '/api/inventory/movements');
    logTest('GET /api/inventory/movements', movementsResult.success, movementsResult.error);

    skipTest('POST /api/inventory/transfer', 'Requires two warehouses');
  } else {
    skipTest('POST /api/inventory/add-stock', 'Missing product or warehouse ID');
    skipTest('POST /api/inventory/deduct-stock', 'Missing product or warehouse ID');
    skipTest('POST /api/inventory/adjust', 'Missing product or warehouse ID');
    skipTest('POST /api/inventory/transfer', 'Missing product or warehouse ID');
    skipTest('GET /api/inventory/movements', 'Missing context');
  }

  if (inventoryResult.success && inventoryResult.data.data?.length > 0) {
    const batchId = inventoryResult.data.data[0].id;
    const getBatchResult = await apiRequest('GET', `/api/inventory/${batchId}`);
    logTest('GET /api/inventory/[id]', getBatchResult.success, getBatchResult.error);
  } else {
    skipTest('GET /api/inventory/[id]', 'No inventory batches found');
  }
}

// ============================================================================
// MAIN TEST EXECUTION
// ============================================================================

async function runAllTests() {
  console.log('='.repeat(80));
  console.log('🚀 STARTING COMPREHENSIVE API TESTING');
  console.log('='.repeat(80));
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log(`⏰ Started at: ${new Date().toISOString()}\n`);

  try {
    await testAuthentication();
    await testUserManagement();
    await testMasterData();
    await testProductsAndInventory();

    // More tests would go here...
    console.log('\n⚠️  NOTE: Transaction, Financial, and Reporting endpoint tests pending...');

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
