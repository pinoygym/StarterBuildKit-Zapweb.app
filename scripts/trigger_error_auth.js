
const BASE_URL = 'http://localhost:3000';

async function checkWithAuth() {
    try {
        // 1. Login
        console.log('Logging in...');
        const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'cybergada@gmail.com', password: 'Qweasd145698@' })
        });

        if (!loginRes.ok) {
            console.log('Login failed', loginRes.status, await loginRes.text());
            return;
        }

        const cookieHeader = loginRes.headers.get('set-cookie');
        const tokenMatch = cookieHeader.match(/auth-token=([^;]+)/);
        const methodMatch = cookieHeader.match(/auth-method=([^;]+)/);
        if (!tokenMatch) {
            console.log('No auth-token found in cookie');
            return;
        }
        const cookie = `auth-token=${tokenMatch[1]}; auth-method=${methodMatch ? methodMatch[1] : 'credentials'}`;
        console.log('Got cookie, testing endpoints...');

        // 2. Check failing endpoints
        const urls = [
            '/api/inventory/adjustments?page=1&limit=25',
            '/api/dashboard/kpis'
        ];

        for (const path of urls) {
            console.log(`Checking ${path}...`);
            const res = await fetch(BASE_URL + path, {
                headers: { Cookie: cookie }
            });
            console.log(`Status: ${res.status}`);
            if (res.status === 500) {
                console.log('Body:', await res.text());
            }
        }

    } catch (e) {
        console.log('Error:', e);
    }
}
checkWithAuth();
