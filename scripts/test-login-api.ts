
async function main() {
    const args = process.argv.slice(2);
    const host = '127.0.0.1:3000';
    const path = args[0] || '/api/auth/login';
    const method = args[1] || 'POST';
    const url = `http://${host}${path}`;
    const body = args[2] ? JSON.parse(args[2]) : {
        email: 'cybergada@gmail.com',
        password: 'Qweasd145698@',
    };

    console.log(`Testing ${method} at:`, url);
    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: method === 'GET' ? undefined : JSON.stringify(body),
        });

        console.log('Status:', response.status);
        console.log('Status Text:', response.statusText);
        const text = await response.text();
        console.log('Response body (start):', text.substring(0, 500));

        try {
            const json = JSON.parse(text);
            console.log('JSON parsed successfully');
        } catch (e) {
            console.log('Failed to parse JSON');
        }
    } catch (error) {
        console.error('Fetch error:', error);
    }
}

main();
