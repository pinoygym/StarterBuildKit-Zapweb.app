import { config } from 'dotenv';
config();

async function reproduceError() {
    try {
        console.log('1. Logging in...');
        const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'pinoygym@gmail.com',
                password: 'Qweasd145698@'
            })
        });

        const loginData = await loginResponse.json();

        if (!loginResponse.ok) {
            console.error('Login failed:', loginData);
            return;
        }

        const token = loginData.token; // Assuming token is returned directly or in a cookie. 
        // If it's httpOnly cookie, fetch automatically handles it if we weren't in node.
        // But in node fetch, we might need to extract the cookie.

        // Check how the API expects the token. Usually Bearer header or cookie.
        // Looking at middleware or other tests would confirm.
        // Assuming Bearer token for now based on typical setups, but let's check the login response structure from test-login.js output if I had run it.
        // Actually, let's just grab the set-cookie header if it exists.

        const cookie = loginResponse.headers.get('set-cookie');
        const headers: Record<string, string> = {
            'Content-Type': 'application/json'
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        if (cookie) {
            headers['Cookie'] = cookie;
        }

        console.log('2. Fetching Receiving Vouchers...');
        const rvResponse = await fetch('http://localhost:3000/api/receiving-vouchers', {
            method: 'GET',
            headers: headers
        });

        const rvData = await rvResponse.json();
        console.log('RV Status:', rvResponse.status);

        if (!rvResponse.ok) {
            console.log('RV Error Response:', JSON.stringify(rvData, null, 2));
        } else {
            console.log('RV Success, count:', rvData.data?.length);
        }

    } catch (error) {
        console.error('Script failed:', error);
    }
}

reproduceError();
