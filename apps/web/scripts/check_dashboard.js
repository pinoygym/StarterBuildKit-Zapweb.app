
const BASE_URL = 'http://localhost:3000';
console.log('Testing Dashboard API at ' + BASE_URL);

async function checkDashboard() {
    try {
        // Assuming /api/dashboard based on convention, or check routes.tsx?
        // Actually typically dashboard data comes from strictly typed server components or a specific route.
        // Let's try to hit the page itself.
        const res = await fetch(BASE_URL + '/dashboard');
        console.log('Dashboard Page Status:', res.status);
        if (res.status !== 200) {
            console.log('Error Body:', await res.text());
        }

        // Try a likely API endpoint (often /api/dashboard/stats or similar)
        const apiRes = await fetch(BASE_URL + '/api/dashboard/stats'); // Guessing
        console.log('API /api/dashboard/stats Status:', apiRes.status);
        if (apiRes.status !== 404) {
            console.log('API Body:', await apiRes.text());
        }

        const apiRes2 = await fetch(BASE_URL + '/api/analytics/dashboard'); // Guessing
        console.log('API /api/analytics/dashboard Status:', apiRes2.status);
    } catch (e) {
        console.error('Fetch failed:', e);
    }
}

checkDashboard();
