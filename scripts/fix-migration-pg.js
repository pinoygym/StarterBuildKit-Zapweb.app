const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load .env.local manually since we are running with node
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
}

async function main() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        console.error('DATABASE_URL not found in environment');
        process.exit(1);
    }

    console.log('Connecting to database...');
    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false } // Needed for neon sometimes
    });

    await client.connect();

    try {
        const migrationName = '20251208025806_add_service_report_system';
        console.log(`Deleting migration record: ${migrationName}`);

        // Check if table exists first (it might be _prisma_migrations or public._prisma_migrations)
        const res = await client.query(
            `DELETE FROM "_prisma_migrations" WHERE "migration_name" = $1`,
            [migrationName]
        );
        console.log(`Deleted count: ${res.rowCount}`);
    } catch (err) {
        console.error('Error executing query:', err);
    } finally {
        await client.end();
    }
}

main().catch(console.error);
