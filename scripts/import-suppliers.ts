

import dotenv from 'dotenv';
// Load environment variables immediately
dotenv.config({ path: '.env.local' });

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    try {
        const filePath = path.join(process.cwd(), 'SUPPLIERS NAME.xlsx');

        if (!fs.existsSync(filePath)) {
            throw new Error(`File not found: ${filePath}`);
        }

        console.log(`Reading file: ${filePath}`);
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // Read raw data
        const rawData = XLSX.utils.sheet_to_json(sheet, { defval: "" });

        console.log(`Total rows found: ${rawData.length}`);

        // Skip the first 2 rows (header stuff) and process from index 2 onwards
        // The inspection showed the first data row is at index 2 (0-indexed)
        const dataRows = rawData.slice(2);

        console.log(`Processing ${dataRows.length} supplier records...`);

        let addedCount = 0;
        let skippedCount = 0;
        let errorCount = 0;

        for (const row of dataRows) {
            const anyRow = row as any;

            // Extract and clean data
            const companyName = (anyRow['__EMPTY'] || '').toString().trim();
            const accountName = (anyRow['__EMPTY_1'] || '').toString().trim(); // Not using directly in main fields
            const accountNum = (anyRow['__EMPTY_2'] || '').toString().trim(); // Not using directly
            let phone = (anyRow['__EMPTY_3'] || '').toString().trim();
            let contactPerson = (anyRow['__EMPTY_4'] || '').toString().trim();
            let email = (anyRow['__EMPTY_5'] || '').toString().trim();

            // Skip empty rows
            if (!companyName) {
                continue;
            }

            // Cleanup
            // Remove leading '* ' from phone if present
            if (phone.startsWith('*')) {
                phone = phone.replace(/^\*\s*/, '').trim();
            }
            if (!phone) {
                phone = 'N/A';
            }

            // Default contact person if missing
            if (!contactPerson) {
                contactPerson = 'Representative';
            }

            // Validate email - set to null if invalid or empty
            if (!email || !email.includes('@')) {
                email = null;
            }

            // Check if supplier exists
            const existingSupplier = await prisma.supplier.findFirst({
                where: {
                    companyName: {
                        equals: companyName,
                        mode: 'insensitive', // Case insensitive check
                    },
                },
            });

            if (existingSupplier) {
                console.log(`Skipping existing supplier: ${companyName}`);
                skippedCount++;
                continue;
            }

            try {
                await prisma.supplier.create({
                    data: {
                        id: crypto.randomUUID(),
                        companyName,
                        contactPerson,
                        phone,
                        email,
                        paymentTerms: 'COD', // Default payment term
                        status: 'active',
                        updatedAt: new Date(),
                    },
                });
                console.log(`Added supplier: ${companyName}`);
                addedCount++;
            } catch (err) {
                console.error(`Error adding supplier ${companyName}:`, err);
                errorCount++;
            }
        }

        console.log('\n--- Summary ---');
        console.log(`Total processed: ${dataRows.length}`);
        console.log(`Added: ${addedCount}`);
        console.log(`Skipped (Duplicate): ${skippedCount}`);
        console.log(`Errors: ${errorCount}`);

    } catch (error) {
        console.error('Script failed:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
