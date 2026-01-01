import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';

const filePath = path.join(process.cwd(), 'excel', 'SWINE  OBS PRICE LIST 2025.xlsx');
console.log(`Reading file: ${filePath}`);

try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    console.log(`Sheet Name: ${sheetName}`);

    const sheet = workbook.Sheets[sheetName];
    // Get headers (first row)
    const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    if (jsonData.length > 0) {
        const colSamples: any = {};
        const rowCount = jsonData.length;

        // Check first 50 rows for sample data in likely price columns
        for (let r = 5; r < Math.min(50, rowCount); r++) {
            const row = jsonData[r];
            if (!row) continue;
            [1, 2, 3, 4, 7, 8, 9, 10].forEach(c => {
                if (row[c] !== undefined && row[c] !== null) {
                    if (!colSamples[c]) colSamples[c] = [];
                    if (colSamples[c].length < 3) colSamples[c].push({ row: r, val: row[c] });
                }
            });
        }

        const output = {
            totalRows: rowCount,
            headers: jsonData[4], // Validated row 4 as header
            samples: colSamples
        };
        fs.writeFileSync('analysis-output.json', JSON.stringify(output, null, 2));
        console.log('Analysis saved to analysis-output.json');
    } else {
        console.log('Empty sheet');
    }


} catch (error) {
    console.error('Error reading Excel file:', error);
}
