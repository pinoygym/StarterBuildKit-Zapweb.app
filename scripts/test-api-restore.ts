import fs from 'fs';

async function main() {
    console.log('Logging in...');
    try {
        const loginRes = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'cybergada@gmail.com', password: 'Qweasd145698@' }),
        });

        if (!loginRes.ok) {
            console.error('Login failed:', loginRes.status, await loginRes.text());
            return;
        }

        const loginData = await loginRes.json();
        console.log('Login Response:', JSON.stringify(loginData, null, 2));
        const token = loginData.data?.token || loginRes.headers.get('set-cookie');
        // Wait, the middleware checks cookies OR Authorization header.
        // The login API probably returns a token in the body OR sets a cookie.

        // Let's assume it returns a token in data.token, or we use the cookie.
        // Inspecting login response might be needed if this fails.

        // Construct headers
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        if (loginData.data?.token) {
            headers['Authorization'] = `Bearer ${loginData.data.token}`;
        } else {
            // Handle cookie if no token in body (unlikely for API login usually)
            const cookie = loginRes.headers.get('set-cookie');
            if (cookie) headers['Cookie'] = cookie;
        }

        console.log('Reading production backup...');
        const backupData = JSON.parse(fs.readFileSync('prod-backup.json', 'utf-8'));

        console.log('Sending POST request to http://localhost:3000/api/settings/database/restore ...');

        const res = await fetch('http://localhost:3000/api/settings/database/restore', {
            method: 'POST',
            headers,
            body: JSON.stringify(backupData),
        });

        console.log('Response Status:', res.status, res.statusText);
        const text = await res.text();
        console.log('Response Body:', text);

        if (res.ok) {
            console.log('API Test PASSED');
        } else {
            console.log('API Test FAILED');
        }
    } catch (error: any) {
        console.error('Fetch failed:', error.message);
    }
}

main();
