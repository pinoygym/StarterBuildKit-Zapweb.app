import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL;

async function main() {
    const pool = new Pool({ connectionString });
    try {
        console.log('Adding missing approvalRules column to CompanySettings table...');
        await pool.query('ALTER TABLE "CompanySettings" ADD COLUMN IF NOT EXISTS "approvalRules" TEXT DEFAULT \'{}\';');
        console.log('Column added successfully.');
    } catch (error) {
        console.error('Error adding column:', error);
    } finally {
        await pool.end();
    }
}

main();
