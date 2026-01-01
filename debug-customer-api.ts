
import dotenv from 'dotenv';
dotenv.config();

async function testCustomerApi() {
    const BASE_URL = 'http://127.0.0.1:3007';
    console.log(`Testing ${BASE_URL}/api/customers`);

    try {
        // 1. Login
        console.log('Logging in...');
        const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'cybergada@gmail.com',
                password: 'Qweasd145698@',
            }),
        });

        if (!loginRes.ok) {
            console.error('Login failed:', loginRes.status, await loginRes.text());
            return;
        }

        const loginData = await loginRes.json();
        const token = loginData.token;
        console.log('Login successful, token obtained.');

        // 2. GET /api/customers
        console.log('Fetching customers...');
        const getRes = await fetch(`${BASE_URL}/api/customers`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        console.log('GET /api/customers status:', getRes.status);
        if (!getRes.ok) {
            const text = await getRes.text();
            console.log('Response text:', text.substring(0, 200));
        } else {
            const data = await getRes.json();
            console.log('Success. Count:', data.data?.length);
        }

        // 3. POST /api/customers
        console.log('Creating customer...');
        const postRes = await fetch(`${BASE_URL}/api/customers`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
                companyName: 'Debug Customer',
                contactPerson: 'Debug Person',
                phone: '1234567890',
                email: 'debug@test.com',
                paymentTerms: 'Net 30',
                customerType: 'regular',
            }),
        });

        console.log('POST /api/customers status:', postRes.status);
        if (!postRes.ok) {
            const text = await postRes.text();
            console.log('Response text:', text.substring(0, 200));
        } else {
            const data = await postRes.json();
            console.log('Created customer:', data.data?.id);
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

testCustomerApi();
