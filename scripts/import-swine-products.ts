
import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as path from 'path';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
    const filePath = path.join(process.cwd(), 'excel', 'SWINE  OBS PRICE LIST 2025.xlsx');
    console.log(`Reading file: ${filePath}`);

    let workbook;
    try {
        workbook = XLSX.readFile(filePath);
    } catch (error) {
        console.error('Error reading Excel file:', error);
        return;
    }

    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    // Get headers (first row)
    const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

    if (!jsonData || jsonData.length === 0) {
        console.log('Empty sheet');
        return;
    }

    console.log(`Total rows in Excel: ${jsonData.length}`);

    // Columns to check for product names: 0 (A) and 6 (G)
    // Data starts around row 5 (index 4) based on analysis
    const startRow = 4;
    const nameCols = [0, 6];

    let createdCount = 0;
    let skippedCount = 0;

    for (let i = startRow; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!row) continue;

        for (const colIndex of nameCols) {
            const productName = row[colIndex];

            if (productName && typeof productName === 'string' && productName.trim().length > 0) {
                const trimmedName = productName.trim();

                // Check if exists
                const existing = await prisma.product.findFirst({
                    where: { name: trimmedName }
                });

                if (existing) {
                    // console.log(`Skipping existing: ${trimmedName}`);
                    skippedCount++;
                    continue;
                }

                // Create product
                await prisma.product.create({
                    data: {
                        id: crypto.randomUUID(),
                        name: trimmedName,
                        description: 'Imported from Swine Price List 2025',
                        category: 'Swine Feed',
                        imageUrl: null,
                        basePrice: 0, // Default as per plan
                        baseUOM: 'BAG', // Default as per plan
                        minStockLevel: 0,
                        shelfLifeDays: 0,
                        status: 'active',
                        updatedAt: new Date(),
                    }
                });
                console.log(`Created: ${trimmedName}`);
                createdCount++;
            }
        }
    }

    console.log('-----------------------------------');
    console.log(`Import Complete.`);
    console.log(`Created: ${createdCount}`);
    console.log(`Skipped (Already Existed): ${skippedCount}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
