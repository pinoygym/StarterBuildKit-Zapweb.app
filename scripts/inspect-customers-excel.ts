
import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';

const filePath = path.join(process.cwd(), 'mabini customer.xlsx');


const workbook = XLSX.readFile(filePath);
console.log('Sheets:', workbook.SheetNames);

const sheetName = workbook.SheetNames[1]; // Try Sheet2
const sheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" }) as any[][];

console.log(`Total Rows: ${data.length}`);

// Find header row
let headerRowIndex = -1;
for (let i = 0; i < Math.min(20, data.length); i++) {
    const row = data[i];
    const rowStr = JSON.stringify(row).toUpperCase();
    if (rowStr.includes('ACCOUNT NAME')) {

        headerRowIndex = i;
        console.log(`Header found at index ${i}`);
        console.log('Headers (length ' + row.length + '):');
        row.forEach((h: any, idx: number) => console.log(`[${idx}] ${h}`));
        break;
    }
}

if (headerRowIndex === -1) {
    console.log('Could not find header row with "ACCOUNT NAME"');
    process.exit(1);
}

// Show first few data rows
console.log('--- Sample Data ---');
for (let i = headerRowIndex + 1; i < headerRowIndex + 4; i++) {
    if (i < data.length) {
        console.log(`Row ${i}:`, data[i]);
    }
}
