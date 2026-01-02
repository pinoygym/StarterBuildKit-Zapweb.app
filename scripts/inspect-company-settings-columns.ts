import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL;

async function main() {
    const pool = new Pool({ connectionString });
    try {
        console.log('Inspecting columns of CompanySettings table...');
        const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'CompanySettings'
      ORDER BY column_name;
    `);
        console.log('Columns:', JSON.stringify(result.rows, null, 2));
    } catch (error) {
        console.error('Error inspecting table:', error);
    } finally {
        await pool.end();
    }
}

main();
