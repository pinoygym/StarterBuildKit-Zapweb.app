
import dotenv from 'dotenv';
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

async function getNextCustomerCodeStart(): Promise<number> {
    const customers = await prisma.customer.findMany({
        select: { customerCode: true },
    });
    let maxNum = 0;
    for (const c of customers) {
        const match = c.customerCode.match(/CUST-(\d+)/);
        if (match) {
            const num = parseInt(match[1], 10);
            if (num > maxNum) maxNum = num;
        }
    }
    return maxNum + 1;
}

async function main() {
    try {
        const filePath = path.join(process.cwd(), 'customer to be input.xlsx');
        if (!fs.existsSync(filePath)) {
            throw new Error(`File not found: ${filePath}`);
        }

        console.log(`Reading file: ${filePath}`);
        const workbook = XLSX.readFile(filePath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]]; // Sheet 1

        // Read as array of arrays
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" }) as any[][];
        console.log(`Total rows: ${data.length}`);

        // Hardcode header row to 0 as verified by inspection
        const headerRowIndex = 0;
        console.log(`Using header at row ${headerRowIndex}`);

        // Get starting sequence
        let nextCodeSeq = await getNextCustomerCodeStart();
        console.log(`Starting customer code sequence: ${nextCodeSeq}`);

        let addedCount = 0;
        let skippedCount = 0;
        let errorCount = 0;

        // Iterate data rows
        for (let i = headerRowIndex + 1; i < data.length; i++) {
            const row = data[i];

            // Expected columns based on inspection:
            // 0: Customer Name
            // 1: Address
            // 2: Contact Number
            // 3: Contact Person

            const companyName = (row[0] || '').toString().trim();
            const address = (row[1] || '').toString().trim();
            let phone = (row[2] || '').toString().trim();
            const contactPerson = (row[3] || '').toString().trim();

            if (!companyName || companyName.toUpperCase() === 'CUSTOMER NAME') {
                continue;
            }

            // Check duplicate
            const existing = await prisma.customer.findFirst({
                where: {
                    companyName: { equals: companyName, mode: 'insensitive' }
                }
            });

            if (existing) {
                console.log(`Skipping existing: ${companyName}`);
                skippedCount++;
                continue;
            }

            // Cleanup phone
            if (phone.startsWith('*')) {
                phone = phone.replace(/^\*\s*/, '').trim();
            }
            if (!phone) {
                phone = 'N/A';
            }

            // Generate code
            const customerCode = `CUST-${nextCodeSeq.toString().padStart(5, '0')}`;
            nextCodeSeq++;

            try {
                await prisma.customer.create({
                    data: {
                        id: crypto.randomUUID(),
                        customerCode,
                        companyName,
                        contactPerson: contactPerson || 'Representative',
                        phone: phone,
                        email: null,
                        city: null, // Address field contains full address usually
                        address: address || null,
                        paymentTerms: 'COD', // Default
                        status: 'active',
                        updatedAt: new Date()
                    }
                });
                console.log(`Added: ${companyName} (${customerCode})`);
                addedCount++;
            } catch (err) {
                console.error(`Error adding ${companyName}:`, err);
                errorCount++;
            }
        }

        console.log('\n--- Summary ---');
        console.log(`Added: ${addedCount}`);
        console.log(`Skipped: ${skippedCount}`);
        console.log(`Errors: ${errorCount}`);

    } catch (e) {
        console.error('Script failed:', e);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
