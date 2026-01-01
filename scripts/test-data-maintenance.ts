/**
 * Comprehensive test for all Data Maintenance modules
 * Tests CREATE, UPDATE, DELETE operations for each module with authentication
 */

const BASE_URL = 'http://localhost:3000/api/data-maintenance';
const AUTH_URL = 'http://localhost:3000/api/auth';

interface TestResult {
    module: string;
    operation: string;
    success: boolean;
    error?: string;
    details?: any;
}

const results: TestResult[] = [];
let authToken: string | null = null;

// Helper function to login and get auth token
async function login() {
    console.log('🔐 Logging in...');

    const response = await fetch(`${AUTH_URL}/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            email: 'cybergada@gmail.com',
            password: 'Qweasd145698@',
        }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
        throw new Error(`Login failed: ${data.error || 'Unknown error'}`);
    }

    authToken = data.token;
    console.log('✅ Login successful\n');
    return authToken;
}

// Helper function to make API calls
async function apiCall(method: string, url: string, body?: any) {
    if (!authToken) {
        throw new Error('Not authenticated');
    }

    const options: RequestInit = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
        },
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
    }

    return data;
}

// Test a single module
async function testModule(
    type: string,
    moduleName: string,
    createData: any,
    updateData: any
) {
    let createdId: string | null = null;

    try {
        // Test CREATE
        console.log(`\n📝 Testing ${moduleName} - CREATE...`);
        const createResponse = await apiCall('POST', `${BASE_URL}/${type}`, createData);

        if (!createResponse.success || !createResponse.data?.id) {
            throw new Error('Create failed: No ID returned');
        }

        createdId = createResponse.data.id;
        results.push({
            module: moduleName,
            operation: 'CREATE',
            success: true,
            details: { id: createdId },
        });
        console.log(`✅ ${moduleName} - CREATE successful (ID: ${createdId})`);

        // Test UPDATE
        console.log(`📝 Testing ${moduleName} - UPDATE...`);
        const updateResponse = await apiCall(
            'PUT',
            `${BASE_URL}/${type}/${createdId}`,
            updateData
        );

        if (!updateResponse.success) {
            throw new Error('Update failed');
        }

        results.push({
            module: moduleName,
            operation: 'UPDATE',
            success: true,
        });
        console.log(`✅ ${moduleName} - UPDATE successful`);

        // Test DELETE
        console.log(`📝 Testing ${moduleName} - DELETE...`);
        const deleteResponse = await apiCall('DELETE', `${BASE_URL}/${type}/${createdId}`);

        if (!deleteResponse.success) {
            throw new Error('Delete failed');
        }

        results.push({
            module: moduleName,
            operation: 'DELETE',
            success: true,
        });
        console.log(`✅ ${moduleName} - DELETE successful`);

        createdId = null; // Successfully deleted

    } catch (error: any) {
        const operation = !createdId ? 'CREATE' : 'UPDATE/DELETE';
        results.push({
            module: moduleName,
            operation,
            success: false,
            error: error.message,
        });
        console.error(`❌ ${moduleName} - ${operation} failed:`, error.message);

        // Cleanup if creation succeeded
        if (createdId) {
            try {
                await apiCall('DELETE', `${BASE_URL}/${type}/${createdId}`);
                console.log(`🧹 Cleaned up ${moduleName} (ID: ${createdId})`);
            } catch (cleanupError) {
                console.error(`⚠️  Failed to cleanup ${moduleName}:`, cleanupError);
            }
        }
    }
}

async function runTests() {
    console.log('🧪 Starting Data Maintenance Module Tests...\n');
    console.log('='.repeat(70));

    try {
        // Login first
        await login();

        const timestamp = Date.now();

        // Test 1: Product Categories
        await testModule(
            'product-categories',
            'Product Categories',
            {
                name: `Test Product Category ${timestamp}`,
                code: `PC-${timestamp}`,
                description: 'Test product category',
                status: 'active',
            },
            {
                description: 'Updated product category description',
            }
        );

        // Test 2: Expense Categories
        await testModule(
            'expense-categories',
            'Expense Categories',
            {
                name: `Test Expense Category ${timestamp}`,
                code: `EC-${timestamp}`,
                description: 'Test expense category',
                status: 'active',
            },
            {
                description: 'Updated expense category description',
            }
        );

        // Test 3: Payment Methods
        await testModule(
            'payment-methods',
            'Payment Methods',
            {
                name: `Test Payment Method ${timestamp}`,
                code: `PM-${timestamp}`,
                description: 'Test payment method',
                status: 'active',
                applicableTo: ['pos', 'ar'], // lowercase as per validation schema
            },
            {
                description: 'Updated payment method description',
            }
        );

        // Test 4: Units of Measure
        await testModule(
            'units-of-measure',
            'Units of Measure',
            {
                name: `Test UOM ${timestamp}`,
                code: `UOM-${timestamp}`,
                description: 'Test unit of measure',
                status: 'active',
            },
            {
                description: 'Updated UOM description',
            }
        );

        // Test 5: Expense Vendors
        await testModule(
            'expense-vendors',
            'Expense Vendors',
            {
                name: `Test Vendor ${timestamp}`,
                contactPerson: 'John Doe',
                phone: '1234567890',
                email: `vendor${timestamp}@test.com`,
                status: 'active',
            },
            {
                contactPerson: 'Jane Doe',
            }
        );

        // Test 6: Sales Agents
        await testModule(
            'sales-agents',
            'Sales Agents',
            {
                name: `Test Agent ${timestamp}`,
                code: `SA-${timestamp}`,
                contactPerson: 'Agent Smith',
                phone: '1234567890',
                email: `agent${timestamp}@test.com`,
                status: 'active',
            },
            {
                contactPerson: 'Agent Jones',
            }
        );

    } catch (error: any) {
        console.error('\n💥 Fatal error:', error.message);
        process.exit(1);
    }

    console.log('\n' + '='.repeat(70));
    console.log('\n📊 Test Summary:\n');

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    const totalModules = 6;
    const totalOperations = totalModules * 3; // CREATE, UPDATE, DELETE per module

    console.log(`✅ Passed: ${successCount}/${totalOperations}`);
    console.log(`❌ Failed: ${failCount}/${totalOperations}`);
    console.log(`📈 Success Rate: ${((successCount / totalOperations) * 100).toFixed(1)}%\n`);

    if (failCount > 0) {
        console.log('❌ Failed Operations:\n');
        results
            .filter(r => !r.success)
            .forEach(r => {
                console.log(`  • ${r.module} (${r.operation}): ${r.error}`);
            });
        console.log('');
    }

    // Summary by module
    console.log('📋 Results by Module:\n');
    const modules = ['Product Categories', 'Expense Categories', 'Payment Methods', 'Units of Measure', 'Expense Vendors', 'Sales Agents'];

    modules.forEach(module => {
        const moduleResults = results.filter(r => r.module === module);
        const moduleSuccess = moduleResults.filter(r => r.success).length;
        const moduleTotal = 3; // CREATE, UPDATE, DELETE
        const status = moduleSuccess === moduleTotal ? '✅' : moduleSuccess > 0 ? '⚠️' : '❌';
        console.log(`  ${status} ${module}: ${moduleSuccess}/${moduleTotal} operations passed`);
    });

    console.log('\n' + '='.repeat(70));

    if (failCount === 0) {
        console.log('\n🎉 All data maintenance modules are working correctly!');
    } else {
        console.log('\n⚠️  Some modules have issues. Please review the errors above.');
    }

    process.exit(failCount > 0 ? 1 : 0);
}

// Run tests
runTests().catch((error) => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
});
