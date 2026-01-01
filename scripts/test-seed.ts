
import 'dotenv/config';

async function main() {
    console.log('Testing seed endpoint...');
    try {
        const res = await fetch('http://localhost:3000/api/dev/seed', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        });

        console.log(`Status: ${res.status}`);
        const text = await res.text();
        if (res.ok) {
            console.log('Success:', text.substring(0, 200));
        } else {
            console.error('Failed:', text.substring(0, 500));
        }
    } catch (e) {
        console.error('Error:', e);
    }
}

main();
