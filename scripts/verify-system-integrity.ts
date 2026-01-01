/**
 * System Integrity Verification Script
 * Comprehensive checks for application health and security
 */

const API_BASE = 'http://localhost:3000';

interface IntegrityCheck {
    category: string;
    check: string;
    status: 'PASS' | 'FAIL' | 'WARN';
    message: string;
    timestamp: string;
}

const results: IntegrityCheck[] = [];

function logCheck(category: string, check: string, status: 'PASS' | 'FAIL' | 'WARN', message: string) {
    const result: IntegrityCheck = {
        category,
        check,
        status,
        message,
        timestamp: new Date().toISOString()
    };
    results.push(result);

    const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
    console.log(`${icon} [${category}] ${check}: ${message}`);
}

// 1. Application Health Checks
async function checkApplicationHealth() {
    console.log('\n🏥 Application Health Checks\n');

    try {
        // Check if server is responding
        const response = await fetch(`${API_BASE}/login`);
        if (response.ok || response.status === 200 || response.status === 304) {
            logCheck('Application', 'Server Responding', 'PASS', `Server is running (HTTP ${response.status})`);
        } else {
            logCheck('Application', 'Server Responding', 'WARN', `Unexpected status: ${response.status}`);
        }
    } catch (error: any) {
        logCheck('Application', 'Server Responding', 'FAIL', `Server not accessible: ${error.message}`);
    }

    // Check response time
    try {
        const start = Date.now();
        await fetch(`${API_BASE}/login`);
        const duration = Date.now() - start;

        if (duration < 1000) {
            logCheck('Application', 'Response Time', 'PASS', `${duration}ms (excellent)`);
        } else if (duration < 3000) {
            logCheck('Application', 'Response Time', 'WARN', `${duration}ms (acceptable)`);
        } else {
            logCheck('Application', 'Response Time', 'FAIL', `${duration}ms (too slow)`);
        }
    } catch (error: any) {
        logCheck('Application', 'Response Time', 'FAIL', `Could not measure: ${error.message}`);
    }
}

// 2. Security Configuration Checks
async function checkSecurityConfiguration() {
    console.log('\n🔒 Security Configuration Checks\n');

    try {
        const response = await fetch(`${API_BASE}/login`);
        const headers = response.headers;

        // Check security headers
        const securityHeaders = [
            'x-frame-options',
            'x-content-type-options',
            'x-xss-protection',
            'strict-transport-security',
            'referrer-policy'
        ];

        for (const header of securityHeaders) {
            if (headers.get(header)) {
                logCheck('Security', `Header: ${header}`, 'PASS', headers.get(header) || 'present');
            } else {
                logCheck('Security', `Header: ${header}`, 'FAIL', 'Missing');
            }
        }
    } catch (error: any) {
        logCheck('Security', 'Headers Check', 'FAIL', `Error: ${error.message}`);
    }

    // Check JWT_SECRET configuration
    const jwtSecret = process.env.JWT_SECRET;
    if (jwtSecret && jwtSecret.length >= 32) {
        logCheck('Security', 'JWT_SECRET', 'PASS', `Configured (${jwtSecret.length} characters)`);
    } else if (jwtSecret) {
        logCheck('Security', 'JWT_SECRET', 'FAIL', `Too short (${jwtSecret?.length || 0} < 32 characters)`);
    } else {
        logCheck('Security', 'JWT_SECRET', 'FAIL', 'Not configured');
    }
}

// 3. Authentication System Checks
async function checkAuthenticationSystem() {
    console.log('\n🔐 Authentication System Checks\n');

    try {
        // Test login endpoint
        const loginResponse = await fetch(`${API_BASE}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'cybergada@gmail.com',
                password: 'Qweasd145698@'
            })
        });

        if (loginResponse.ok) {
            const data = await loginResponse.json();
            if (data.success && data.token) {
                logCheck('Authentication', 'Login Endpoint', 'PASS', 'Login successful with token');

                // Test token verification
                const meResponse = await fetch(`${API_BASE}/api/auth/me`, {
                    headers: { 'Authorization': `Bearer ${data.token}` }
                });

                if (meResponse.ok) {
                    logCheck('Authentication', 'Token Verification', 'PASS', 'Token verified successfully');
                } else {
                    logCheck('Authentication', 'Token Verification', 'FAIL', `Status: ${meResponse.status}`);
                }

                // Check cookie settings
                const setCookie = loginResponse.headers.get('set-cookie');
                if (setCookie) {
                    const hasHttpOnly = setCookie.includes('HttpOnly');
                    const hasSameSite = setCookie.includes('SameSite');
                    const hasSecure = setCookie.includes('Secure');

                    logCheck('Authentication', 'Cookie HttpOnly', hasHttpOnly ? 'PASS' : 'FAIL', hasHttpOnly ? 'Set' : 'Missing');
                    logCheck('Authentication', 'Cookie SameSite', hasSameSite ? 'PASS' : 'FAIL', hasSameSite ? 'Set' : 'Missing');

                    if (process.env.NODE_ENV === 'production') {
                        logCheck('Authentication', 'Cookie Secure', hasSecure ? 'PASS' : 'FAIL', hasSecure ? 'Set' : 'Missing');
                    }
                }
            } else {
                logCheck('Authentication', 'Login Endpoint', 'FAIL', 'No token returned');
            }
        } else {
            logCheck('Authentication', 'Login Endpoint', 'FAIL', `HTTP ${loginResponse.status}`);
        }
    } catch (error: any) {
        logCheck('Authentication', 'Login System', 'FAIL', `Error: ${error.message}`);
    }
}

// 4. Database Connectivity Checks
async function checkDatabaseConnectivity() {
    console.log('\n💾 Database Connectivity Checks\n');

    try {
        // Login first to get token
        const loginResponse = await fetch(`${API_BASE}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'cybergada@gmail.com',
                password: 'Qweasd145698@'
            })
        });

        if (!loginResponse.ok) {
            logCheck('Database', 'Connection Test', 'FAIL', 'Could not authenticate for DB test');
            return;
        }

        const { token } = await loginResponse.json();

        // Test database query via API
        const statsResponse = await fetch(`${API_BASE}/api/settings/database/stats`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (statsResponse.ok) {
            const stats = await statsResponse.json();
            logCheck('Database', 'Query Operations', 'PASS', `Retrieved stats for ${stats.totalTables || 'N/A'} tables`);
            logCheck('Database', 'Connection', 'PASS', 'Database accessible and responding');
        } else {
            logCheck('Database', 'Query Operations', 'FAIL', `HTTP ${statsResponse.status}`);
        }
    } catch (error: any) {
        logCheck('Database', 'Connectivity', 'FAIL', `Error: ${error.message}`);
    }
}

// 5. API Endpoints Checks
async function checkAPIEndpoints() {
    console.log('\n🌐 API Endpoints Checks\n');

    const endpoints = [
        { path: '/api/auth/me', method: 'GET', requiresAuth: true },
        { path: '/api/auth/login', method: 'POST', requiresAuth: false },
        { path: '/login', method: 'GET', requiresAuth: false },
    ];

    for (const endpoint of endpoints) {
        try {
            const response = await fetch(`${API_BASE}${endpoint.path}`, {
                method: endpoint.method
            });

            if (endpoint.requiresAuth) {
                // Should return 401 without auth
                if (response.status === 401 || response.status === 403) {
                    logCheck('API', `${endpoint.path}`, 'PASS', 'Properly protected');
                } else {
                    logCheck('API', `${endpoint.path}`, 'WARN', `Expected 401, got ${response.status}`);
                }
            } else {
                // Should be accessible
                if (response.ok || response.status < 400) {
                    logCheck('API', `${endpoint.path}`, 'PASS', `Accessible (${response.status})`);
                } else {
                    logCheck('API', `${endpoint.path}`, 'WARN', `Status: ${response.status}`);
                }
            }
        } catch (error: any) {
            logCheck('API', `${endpoint.path}`, 'FAIL', `Error: ${error.message}`);
        }
    }
}

// 6. Generate Summary Report
function generateSummaryReport() {
    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║           SYSTEM INTEGRITY REPORT                      ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');

    const passed = results.filter(r => r.status === 'PASS').length;
    const failed = results.filter(r => r.status === 'FAIL').length;
    const warnings = results.filter(r => r.status === 'WARN').length;
    const total = results.length;

    console.log(`Total Checks: ${total}`);
    console.log(`✅ Passed: ${passed} (${((passed / total) * 100).toFixed(1)}%)`);
    console.log(`❌ Failed: ${failed} (${((failed / total) * 100).toFixed(1)}%)`);
    console.log(`⚠️  Warnings: ${warnings} (${((warnings / total) * 100).toFixed(1)}%)`);

    // Overall status
    let overallStatus = 'HEALTHY';
    if (failed > 0) {
        overallStatus = failed > 3 ? 'CRITICAL' : 'DEGRADED';
    } else if (warnings > 3) {
        overallStatus = 'NEEDS ATTENTION';
    }

    console.log(`\n🎯 Overall Status: ${overallStatus}\n`);

    // Failed checks
    if (failed > 0) {
        console.log('❌ Failed Checks:');
        results.filter(r => r.status === 'FAIL').forEach(r => {
            console.log(`   - [${r.category}] ${r.check}: ${r.message}`);
        });
        console.log('');
    }

    // Warnings
    if (warnings > 0) {
        console.log('⚠️  Warnings:');
        results.filter(r => r.status === 'WARN').forEach(r => {
            console.log(`   - [${r.category}] ${r.check}: ${r.message}`);
        });
        console.log('');
    }

    // Recommendations
    console.log('📋 Recommendations:');
    if (failed === 0 && warnings === 0) {
        console.log('   ✅ System is healthy - no action required');
    } else {
        if (failed > 0) {
            console.log('   🔴 Address all failed checks immediately');
        }
        if (warnings > 0) {
            console.log('   🟡 Review warnings and address if necessary');
        }
    }

    console.log(`\n⏰ Completed at: ${new Date().toISOString()}\n`);

    return overallStatus;
}

// Main execution
async function runIntegrityChecks() {
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║     System Integrity Verification                     ║');
    console.log('║     Comprehensive Health & Security Checks             ║');
    console.log('╚════════════════════════════════════════════════════════╝');
    console.log(`\n⏰ Started at: ${new Date().toISOString()}\n`);

    await checkApplicationHealth();
    await checkSecurityConfiguration();
    await checkAuthenticationSystem();
    await checkDatabaseConnectivity();
    await checkAPIEndpoints();

    const status = generateSummaryReport();

    // Exit with appropriate code
    process.exit(status === 'HEALTHY' ? 0 : 1);
}

// Run the checks
runIntegrityChecks().catch(error => {
    console.error('Fatal error during integrity checks:', error);
    process.exit(1);
});
