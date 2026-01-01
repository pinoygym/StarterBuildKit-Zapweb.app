
import dotenv from 'dotenv';
dotenv.config();

async function testAuthApi() {
    const BASE_URL = 'http://127.0.0.1:3007';
    console.log(`Testing ${BASE_URL}/api/auth/login`);

    try {
        // 1. Invalid Login
        console.log('Testing Invalid Login...');
        const invalidRes = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'invalid@example.com',
                password: 'wrong',
            }),
        });

        console.log('Invalid Login Status:', invalidRes.status);
        if (invalidRes.headers.get('content-type')?.includes('application/json')) {
            const data = await invalidRes.json();
            console.log('Invalid Login Body:', JSON.stringify(data));
        } else {
            const text = await invalidRes.text();
            console.log('Invalid Login Text (truncated):', text.substring(0, 200));
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

testAuthApi();
