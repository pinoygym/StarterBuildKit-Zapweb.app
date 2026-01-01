import { spawn } from 'child_process';

const ITERATIONS = 10;
const TEST_FILE = 'tests/selenium/uom-conversion-test.ts';

interface TestResult {
    iteration: number;
    passed: boolean;
    duration: number;
    error?: string;
}

async function runTest(iteration: number): Promise<TestResult> {
    const startTime = Date.now();

    return new Promise((resolve) => {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`Running iteration ${iteration}/${ITERATIONS}...`);
        console.log('='.repeat(60));

        const child = spawn('npx', ['tsx', TEST_FILE], {
            stdio: 'inherit',
            shell: true,
        });

        child.on('close', (code) => {
            const duration = Date.now() - startTime;
            const passed = code === 0;

            resolve({
                iteration,
                passed,
                duration,
                error: passed ? undefined : `Exit code: ${code}`,
            });
        });

        child.on('error', (error) => {
            const duration = Date.now() - startTime;
            resolve({
                iteration,
                passed: false,
                duration,
                error: error.message,
            });
        });
    });
}

async function main() {
    console.log('🚀 Starting UOM Conversion Test - 10 Iterations');
    console.log(`Test file: ${TEST_FILE}`);
    console.log(`Total iterations: ${ITERATIONS}\n`);

    const results: TestResult[] = [];
    const overallStartTime = Date.now();

    for (let i = 1; i <= ITERATIONS; i++) {
        const result = await runTest(i);
        results.push(result);

        if (result.passed) {
            console.log(`✅ Iteration ${i} PASSED (${(result.duration / 1000).toFixed(2)}s)`);
        } else {
            console.log(`❌ Iteration ${i} FAILED (${(result.duration / 1000).toFixed(2)}s)`);
            if (result.error) {
                console.log(`   Error: ${result.error}`);
            }
        }
    }

    const overallDuration = Date.now() - overallStartTime;
    const passedCount = results.filter(r => r.passed).length;
    const failedCount = results.filter(r => r.passed === false).length;
    const passRate = ((passedCount / ITERATIONS) * 100).toFixed(1);

    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Iterations: ${ITERATIONS}`);
    console.log(`Passed: ${passedCount} ✅`);
    console.log(`Failed: ${failedCount} ❌`);
    console.log(`Pass Rate: ${passRate}%`);
    console.log(`Total Time: ${(overallDuration / 1000).toFixed(2)}s`);
    console.log(`Average Time per Test: ${(overallDuration / ITERATIONS / 1000).toFixed(2)}s`);

    if (failedCount > 0) {
        console.log('\n❌ Failed Iterations:');
        results.filter(r => !r.passed).forEach(r => {
            console.log(`  - Iteration ${r.iteration}: ${r.error || 'Unknown error'}`);
        });
    }

    console.log('='.repeat(60));

    if (passedCount === ITERATIONS) {
        console.log('\n🎉 All tests passed! UOM conversion is working perfectly!');
    } else {
        console.log(`\n⚠️  ${failedCount} test(s) failed. Review the errors above.`);
        process.exit(1);
    }
}

main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
