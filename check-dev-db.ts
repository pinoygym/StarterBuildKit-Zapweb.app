import pg from 'pg';
const { Client } = pg;
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const url = process.env.DATABASE_URL;

async function main() {
    console.log('Checking database from .env.local');
    if (!url) {
        console.error('DATABASE_URL not found');
        return;
    }
    const client = new Client({
        connectionString: url,
    });
    await client.connect();
    try {
        const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        console.log('Tables found:', res.rows.length);
        const names = res.rows.map(r => r.table_name);
        console.log('User table exists:', names.includes('User'));
        console.log('All tables:', names.join(', '));
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

main();
