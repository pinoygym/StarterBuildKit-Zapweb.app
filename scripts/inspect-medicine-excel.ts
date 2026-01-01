
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import * as XLSX from 'xlsx';
import * as path from 'path';

async function main() {
    console.log('Inspecting Excel file...');
    const filePath = path.join(process.cwd(), 'excel/Medicine Pricelist2.xlsx');

    try {
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // Get the range
        console.log('Range:', sheet['!ref']);

        // Read first 10 rows with header:1 (array of arrays)
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1, range: 0, defval: '' }) as any[][];

        const fs = require('fs');
        const output = data.slice(0, 50).map((row, index) => `Row ${index}: ${JSON.stringify(row)}`).join('\n');
        fs.writeFileSync('inspect_output.txt', output);
        console.log('Output written to inspect_output.txt');

    } catch (error) {
        console.error('Error reading file:', error);
    }
}

main();
