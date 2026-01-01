// import { fetch } from 'undici'; // Built-in fetch is available in Node 18+

async function verify() {
    console.log('Verifying /api/auth/me response without token...');
    try {
        const response = await fetch('http://localhost:3000/api/auth/me');
        console.log('Status:', response.status);
        const data = await response.json();
        console.log('Data:', JSON.stringify(data, null, 2));

        if (response.status === 200 && (data as any).user === null) {
            console.log('✅ Verification PASSED: Returned 200 and user is null');
        } else {
            console.log('❌ Verification FAILED: Unexpected response');
            process.exit(1);
        }
    } catch (error) {
        console.error('❌ Verification FAILED: Network error', error);
        process.exit(1);
    }
}

verify();
