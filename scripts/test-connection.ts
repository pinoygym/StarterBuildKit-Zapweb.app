import { Pool } from 'pg';

const connectionString = 'postgresql://neondb_owner:npg_gGMhedJ8fN2r@ep-lucky-butterfly-a14apit2-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const pool = new Pool({ connectionString });

async function main() {
    try {
        const client = await pool.connect();
        const res = await client.query('SELECT 1 as connected');
        console.log('Connection successful:', res.rows[0]);
        client.release();
    } catch (err) {
        console.error('Connection failed:', err);
    } finally {
        await pool.end();
    }
}

main();
