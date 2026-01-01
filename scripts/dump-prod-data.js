const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const PROD_URL = 'postgresql://neondb_owner:npg_vhuqV32wAlIp@ep-floral-silence-a1jm7mgz-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const OUTPUT_DIR = path.join(__dirname, '../prisma/seeds/prod-data');

if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function dumpTable(client, tableName) {
    console.log(`Dumping ${tableName}...`);
    try {
        const res = await client.query(`SELECT * FROM "${tableName}"`);
        const filePath = path.join(OUTPUT_DIR, `${tableName}.json`);
        fs.writeFileSync(filePath, JSON.stringify(res.rows, null, 2));
        console.log(`  -> Saved ${res.rows.length} rows to ${filePath}`);
    } catch (err) {
        console.error(`  -> Error dumping ${tableName}:`, err.message);
    }
}

async function main() {
    const client = new Client({ connectionString: PROD_URL });

    try {
        await client.connect();
        console.log('Connected to Production Database');

        // Get all table names
        const res = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
        `);

        const tables = res.rows.map(r => r.table_name);

        // Exclude migrations table
        const tablesToDump = tables.filter(t => t !== '_prisma_migrations');

        for (const table of tablesToDump) {
            await dumpTable(client, table);
        }

        console.log('\nDump completed successfully!');

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

main();
