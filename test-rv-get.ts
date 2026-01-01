import { config } from 'dotenv';
config();

async function testRVGet() {
    try {
        const response = await fetch('http://localhost:3000/api/receiving-vouchers', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const data = await response.json();

        console.log('Status:', response.status);
        console.log('Response:', JSON.stringify(data, null, 2));

        if (!response.ok) {
            console.error('Error details:', data);
        }
    } catch (error) {
        console.error('Request failed:', error);
    }
}

testRVGet();
