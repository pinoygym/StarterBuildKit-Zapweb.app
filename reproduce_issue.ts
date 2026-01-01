
const BASE_URL = 'http://localhost:3000';

async function testLogin() {
    try {
        console.log(`Attempting login to ${BASE_URL}/api/auth/login`);
        const res = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'cybergada@gmail.com',
                password: 'Qweasd145698@',
            }),
        });

        console.log('Status:', res.status);
        console.log('Status Text:', res.statusText);
        const text = await res.text();
        console.log('Body Preview:', text.substring(0, 500));

        try {
            const data = JSON.parse(text);
            console.log('Login JSON parsed successfully:', data);

            if (data.token) {
                const token = data.token;
                console.log('Attempting to create customer...');
                const timestamp = Date.now();
                const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();

                const createRes = await fetch(`${BASE_URL}/api/customers`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        customerCode: `TEST-${timestamp}-${randomSuffix}-1`,
                        companyName: `SearchTest One ${timestamp}`,
                        contactPerson: 'UniqueName Alpha',
                        phone: '09171111111',
                        email: `search1-${timestamp}@test.com`,
                        status: 'active',
                        customerType: 'regular',
                        creditLimit: 1000,
                        paymentTerms: 'Net 30',
                    }),
                });

                console.log('Create Customer Status:', createRes.status);
                const createText = await createRes.text();
                // console.log('Create Body Preview:', createText.substring(0, 500));
                try {
                    const createData = JSON.parse(createText);
                    console.log('Create Customer JSON parsed successfully:', createData);
                } catch (e) {
                    console.error('Failed to parse Create Customer JSON:', e.message);
                    console.error('Body preview:', createText.substring(0, 1000));
                }
            }

        } catch (e) {
            console.error('Failed to parse Login JSON:', e.message);
        }
    } catch (err) {
        console.error('Fetch error:', err);
    }
}

testLogin();
