const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../prisma/migrations/20251213072000_sync_db_state/migration.sql');

try {
    const buffer = fs.readFileSync(filePath);

    // Filter out null bytes (0x00)
    let newBuffer = Buffer.from(buffer.filter(b => b !== 0x00));

    // Check for UTF-8 BOM (EF BB BF)
    if (newBuffer.length >= 3 && newBuffer[0] === 0xEF && newBuffer[1] === 0xBB && newBuffer[2] === 0xBF) {
        newBuffer = newBuffer.slice(3);
        console.log('Removed UTF-8 BOM.');
    }

    fs.writeFileSync(filePath, newBuffer);
    console.log('Processed file: clean UTF-8.');
} catch (e) {
    console.error('Error:', e);
    process.exit(1);
}
