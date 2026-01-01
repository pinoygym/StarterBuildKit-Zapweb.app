
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

try {
    const urlStr = process.env.DATABASE_URL;
    if (!urlStr) {
        console.log('DATABASE_URL not found in env');
    } else {
        const url = new URL(urlStr);
        console.log('Target DB Host:', url.hostname);
        console.log('Target DB Path:', url.pathname);
    }
} catch (e) {
    console.error('Error parsing URL:', e.message);
}
