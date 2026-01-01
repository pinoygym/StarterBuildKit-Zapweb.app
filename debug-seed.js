

async function debugSeed() {
    try {
        const response = await fetch('http://localhost:3000/api/dev/seed', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        });

        const status = response.status;
        console.log(`Status: ${status}`);

        const text = await response.text();
        console.log(`Body: ${text}`);
    } catch (error) {
        console.error('Error:', error);
    }
}

debugSeed();
