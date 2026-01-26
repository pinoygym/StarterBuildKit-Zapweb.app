
import { describe, it, expect } from 'vitest';

const BASE_URL = 'http://localhost:3000';

async function repro() {
    console.log('Logging in...');
    try {
        const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'cybergada@gmail.com',
                password: 'Qweasd145698@',
            }),
        });

        if (!loginRes.ok) {
            console.error('Login failed:', await loginRes.text());
            return;
        }

        const loginData = await loginRes.json();
        const token = loginData.token;
        console.log('Login successful. Token obtained.');

        console.log('Testing GET ' + BASE_URL + '/api/products?page=1&limit=50');

        const response = await fetch(`${BASE_URL}/api/products?page=1&limit=50`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log(`Status: ${response.status}`);
        const text = await response.text();
        console.log(`Body: ${text.substring(0, 1000)}`);

        if (response.status === 500) {
            console.log('SUCCESS: Reproduced 500 error');
        } else {
            console.log('FAILED: Did not reproduce 500 error');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

repro();
