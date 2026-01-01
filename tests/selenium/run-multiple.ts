// Run the E2E test multiple times
const { spawn } = require('child_process');

const ITERATIONS = 10;
let successCount = 0;
let failCount = 0;

async function runTest(iteration: number): Promise<boolean> {
    return new Promise((resolve) => {
        console.log(`\n${'='.repeat(80)}`);
        console.log(`🚀 Starting Test Iteration ${iteration}/${ITERATIONS}`);
        console.log(`${'='.repeat(80)}\n`);

        const testProcess = spawn('npx', ['tsx', 'tests/selenium/e2e-flow.test.ts'], {
            shell: true,
            stdio: 'inherit'
        });

        testProcess.on('close', (code: number | null) => {
            if (code === 0) {
                console.log(`\n✅ Iteration ${iteration} PASSED`);
                successCount++;
                resolve(true);
            } else {
                console.log(`\n❌ Iteration ${iteration} FAILED with exit code ${code}`);
                failCount++;
                resolve(false);
            }
        });

        testProcess.on('error', (error: Error) => {
            console.error(`\n❌ Iteration ${iteration} ERROR:`, error);
            failCount++;
            resolve(false);
        });
    });
}

async function runAllTests() {
    const startTime = Date.now();

    console.log(`\n${'█'.repeat(80)}`);
    console.log(`🎯 Running E2E Test Suite - ${ITERATIONS} Iterations`);
    console.log(`${'█'.repeat(80)}\n`);

    for (let i = 1; i <= ITERATIONS; i++) {
        await runTest(i);

        // Add a small delay between tests to avoid overwhelming the system
        if (i < ITERATIONS) {
            console.log('\n⏳ Waiting 2 seconds before next iteration...\n');
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }

    const endTime = Date.now();
    const totalTime = ((endTime - startTime) / 1000 / 60).toFixed(2);

    console.log(`\n${'█'.repeat(80)}`);
    console.log(`📊 TEST SUITE SUMMARY`);
    console.log(`${'█'.repeat(80)}`);
    console.log(`Total Iterations: ${ITERATIONS}`);
    console.log(`✅ Passed: ${successCount} (${((successCount / ITERATIONS) * 100).toFixed(1)}%)`);
    console.log(`❌ Failed: ${failCount} (${((failCount / ITERATIONS) * 100).toFixed(1)}%)`);
    console.log(`⏱️  Total Time: ${totalTime} minutes`);
    console.log(`${'█'.repeat(80)}\n`);

    if (failCount === 0) {
        console.log('🎉 All tests passed successfully!');
        process.exit(0);
    } else {
        console.log('⚠️  Some tests failed. Please review the logs above.');
        process.exit(1);
    }
}

runAllTests();
