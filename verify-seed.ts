
const BASE_URL = 'http://localhost:3007';

async function main() {
    try {
        console.log('Testing seed endpoint...');
        const seedRes = await fetch(`${BASE_URL}/api/dev/seed`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        });
        console.log('Seed status:', seedRes.status);
        const seedText = await seedRes.text();
        console.log('Seed body:', seedText.substring(0, 200));

        try {
            const seed = JSON.parse(seedText);
            if (!seed.success) {
                console.error('Seed failed:', JSON.stringify(seed, null, 2));
            } else {
                console.log('Seed successful');
            }
        } catch (e) {
            console.error('Seed response is not JSON');
        }

        console.log('Testing login endpoint...');
        const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'cybergada@gmail.com',
                password: 'Qweasd145698@',
            }),
        });
        console.log('Login status:', loginRes.status);
        const loginText = await loginRes.text();
        console.log('Login body:', loginText.substring(0, 200));

        try {
            const loginData = JSON.parse(loginText);
            if (!loginData.success) {
                console.error('Login failed:', JSON.stringify(loginData, null, 2));
            } else {
                console.log('Login successful');
            }
        } catch (e) {
            console.error('Login response is not JSON');
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

main();
