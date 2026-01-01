// Test API endpoint directly
const response = await fetch('http://localhost:3000/api/inventory/transfers', {
    headers: {
        'Cookie': 'auth-token=YOUR_TOKEN_HERE' // Replace with actual token from browser
    }
});

const data = await response.json();
console.log('API Response:', JSON.stringify(data, null, 2));
