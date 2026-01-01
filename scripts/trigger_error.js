
const urls = [
    'http://localhost:3000/api/inventory/adjustments?page=1&limit=25',
    'http://localhost:3000/api/dashboard/kpis'
];

async function check() {
    for (const url of urls) {
        try {
            console.log(`Checking ${url}...`);
            // We might need a valid cookie if these are protected, but 500 often happens before auth or inside the handler.
            // If 401, we know it's reachable. If 500, we hit the bug.
            const res = await fetch(url);
            console.log(`Status: ${res.status}`);
            if (res.status === 500) {
                console.log('Body:', await res.text());
            }
        } catch (e) {
            console.log('Error:', e.message);
        }
    }
}
check();
