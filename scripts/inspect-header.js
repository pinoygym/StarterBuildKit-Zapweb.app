const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../prisma/migrations/20251213072000_sync_db_state/migration.sql');
const buffer = fs.readFileSync(filePath);

console.log('First 20 bytes:', buffer.slice(0, 20));
console.log('As string:', buffer.slice(0, 50).toString('utf8'));
