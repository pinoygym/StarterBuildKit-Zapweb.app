const { Client } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_vhuqV32wAlIp@ep-floral-silence-a1jm7mgz-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

async function countRows() {
    const client = new Client({ connectionString: DATABASE_URL });

    try {
        console.log('Connecting to database...');
        await client.connect();
        console.log('✅ Connected.');

        const tables = [
            'User',
            'Branch',
            'Product',
            'Customer',
            'POSSale',
            'POSReceipt',
            'Warehouse',
            'Inventory'
        ];

        console.log('\n--- Data Integrity Check (Row Counts) ---');

        for (const table of tables) {
            try {
                // Use double quotes for case-sensitive table names if Prisma mapped them that way
                // Usually Prisma names are PascalCase in schema but might be mapped to lowercase or mixed in PG.
                // We'll try capitalized first as that's how they are in Schema, but PG is usually lowercase unless quoted.
                // Actually Prisma defaults to matching the model name if not mapped.
                // Let's verify table existence or just try querying.
                // We will query "User" (quoted)
                const res = await client.query(`SELECT COUNT(*) FROM "${table}"`);
                const count = res.rows[0].count;
                console.log(`${table}: ${count}`);
            } catch (err) {
                // Try lowercase if quoted failed, or it might not exist
                console.log(`${table}: Error or Not Found (${err.message})`);
            }
        }

    } catch (error) {
        console.error('Connection error:', error);
    } finally {
        await client.end();
    }
}

countRows();
