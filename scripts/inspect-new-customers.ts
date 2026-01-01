
import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';

const filePath = path.join(process.cwd(), 'customer to be input.xlsx');

if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
}

const workbook = XLSX.readFile(filePath);
console.log('Sheets:', workbook.SheetNames);
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];

const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });

console.log(`Sheet Name: ${sheetName}`);
console.log(`Total Rows: ${data.length}`);

console.log('First 10 Rows (raw):');
data.slice(0, 10).forEach((row, i) => {
    console.log(`Row ${i}:`, JSON.stringify(row));
});
