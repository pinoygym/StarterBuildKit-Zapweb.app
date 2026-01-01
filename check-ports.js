const http = require('http');

const ports = [3000, 3001, 3002];
const path = '/api/data-maintenance/sales-agents';

ports.forEach(port => {
    const options = {
        hostname: 'localhost',
        port: port,
        path: path,
        method: 'POST', // Use POST as that's what failed
        headers: {
            'Content-Type': 'application/json'
        }
    };

    const req = http.request(options, (res) => {
        console.log(`Port ${port}: Status ${res.statusCode}`);
        res.on('data', (d) => {
            // process.stdout.write(d);
        });
    });

    req.on('error', (e) => {
        console.log(`Port ${port}: Error ${e.message}`);
    });

    req.write(JSON.stringify({ name: 'Test', code: 'TEST' }));
    req.end();
});
