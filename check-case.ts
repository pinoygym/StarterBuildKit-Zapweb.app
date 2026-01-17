import pg from 'pg';
const { Client } = pg;

const url = 'postgresql://neondb_owner:npg_JngWbhwd5H3q@ep-odd-waterfall-a1jyuyy8-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

async function main() {
    const client = new Client({
        connectionString: url,
    });
    await client.connect();
    try {
        const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name ILIKE 'user%'");
        console.log('User-related tables:', res.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

main();
