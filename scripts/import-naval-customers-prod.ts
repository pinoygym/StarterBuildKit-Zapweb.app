import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';

// Production database URL
const PROD_DB_URL = 'postgresql://neondb_owner:npg_vhuqV32wAlIp@ep-floral-silence-a1jm7mgz-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const pool = new Pool({ connectionString: PROD_DB_URL });
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
        console.log('🚀 IMPORTING TO PRODUCTION DATABASE');
        console.log('Database: ep-floral-silence-a1jm7mgz (Production)');
        console.log('');

        const filePath = path.join(process.cwd(), 'excel', 'naval customer.xlsx');
        if (!fs.existsSync(filePath)) {
            throw new Error(`File not found: ${filePath}`);
        }

        console.log(`Reading file: ${filePath}`);
        const workbook = XLSX.readFile(filePath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]]; // Sheet 1

        // Read as array of arrays
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" }) as any[][];
        console.log(`Total rows: ${data.length}`);

        // Find header row
        let headerRowIndex = -1;
        for (let i = 0; i < Math.min(20, data.length); i++) {
            const rowStr = JSON.stringify(data[i]).toUpperCase();
            if (rowStr.includes('ACCOUNT NAME') || rowStr.includes('CUSTOMER') || rowStr.includes('NAME')) {
                headerRowIndex = i;
                break;
            }
        }

        if (headerRowIndex === -1) {
            throw new Error('Could not find header row with "ACCOUNT NAME" or "CUSTOMER"');
        }

        console.log(`Found header at row ${headerRowIndex}`);
        console.log(`Header columns:`, data[headerRowIndex]);

        // Get starting sequence
        let nextCodeSeq = await getNextCustomerCodeStart();
        console.log(`Starting customer code sequence: ${nextCodeSeq}`);
        console.log('');

        let addedCount = 0;
        let skippedCount = 0;
        let errorCount = 0;

        // Iterate data rows
        for (let i = headerRowIndex + 1; i < data.length; i++) {
            const row = data[i];

            // Expected columns based on typical customer Excel format:
            // 0: ACCOUNT NAME / CUSTOMER NAME
            // 1: TOWN/CITY
            // 2: TIN # (optional)

            const companyName = (row[0] || '').toString().trim();
            const city = (row[1] || '').toString().trim();
            const taxId = (row[2] || '').toString().trim();

            if (!companyName || companyName === 'ACCOUNT NAME' || companyName === 'CUSTOMER NAME') {
                continue;
            }

            // Check duplicate
            const existing = await prisma.customer.findFirst({
                where: {
                    companyName: { equals: companyName, mode: 'insensitive' }
                }
            });

            if (existing) {
                console.log(`⏭️  Skipping existing: ${companyName}`);
                skippedCount++;
                continue;
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
                        contactPerson: 'Representative', // Default
                        phone: 'N/A', // Default
                        email: null,
                        city: city || null,
                        taxId: taxId || null,
                        address: city ? `${city}` : null, // Put city in address if nothing else
                        paymentTerms: 'COD', // Default
                        status: 'active',
                        updatedAt: new Date()
                    }
                });
                console.log(`✅ Added: ${companyName} (${customerCode})`);
                addedCount++;
            } catch (err) {
                console.error(`❌ Error adding ${companyName}:`, err);
                errorCount++;
            }
        }

        console.log('');
        console.log('═══════════════════════════════════════');
        console.log('📊 PRODUCTION IMPORT SUMMARY');
        console.log('═══════════════════════════════════════');
        console.log(`✅ Added: ${addedCount}`);
        console.log(`⏭️  Skipped: ${skippedCount}`);
        console.log(`❌ Errors: ${errorCount}`);
        console.log('═══════════════════════════════════════');

    } catch (e) {
        console.error('❌ Script failed:', e);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
