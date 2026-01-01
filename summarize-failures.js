
const fs = require('fs');
try {
    const data = fs.readFileSync('debug_failures.txt', 'utf16le');
    const lines = data.split('\n');
    let currentProduct = '';
    let hasError = false;

    console.log('Summary of UOM Mismatches in Adjustment 2d206960-5128-4059-aa61-27a4f601043a:');
    console.log('========================================================================');

    for (const line of lines) {
        if (line.includes('Product:')) {
            currentProduct = line.trim();
        }
        if (line.includes('❌ UOM')) {
            console.log(currentProduct);
            console.log(line.trim());
            console.log('------------------------------------------------------------------------');
            hasError = true;
        }
    }

    if (!hasError) {
        console.log('No UOM mismatches found in the processed log items.');
    }
} catch (e) {
    console.error('Error processing log:', e.message);
}
