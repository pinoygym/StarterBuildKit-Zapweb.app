import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL;

async function main() {
    const pool = new Pool({ connectionString });
    try {
        console.log('Testing raw SQL access to CompanySettings...');
        const result = await pool.query('SELECT * FROM "CompanySettings" LIMIT 1');
        console.log('Result:', JSON.stringify(result.rows, null, 2));
    } catch (error) {
        console.error('Error querying table:', error);
    } finally {
        await pool.end();
    }
}

main();
