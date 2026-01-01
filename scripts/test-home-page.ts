
async function main() {
    const url = 'http://localhost:3000/';
    console.log('Testing home page at:', url);
    try {
        const response = await fetch(url);
        console.log('Status:', response.status);
        console.log('Status Text:', response.statusText);
        const text = await response.text();
        console.log('Response body (start):', text.substring(0, 500));
    } catch (error) {
        console.error('Fetch error:', error);
    }
}

main();
