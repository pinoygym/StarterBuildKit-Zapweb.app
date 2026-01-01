const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const PROD_URL = 'postgresql://neondb_owner:npg_vhuqV32wAlIp@ep-floral-silence-a1jm7mgz-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

async function repairSchema() {
    console.log('🛠️  Starting Schema Repair for Production...');

    const client = new Client({
        connectionString: PROD_URL,
    });

    try {
        await client.connect();
        console.log('✅ Connected to Production Database');

        const migrationPath = path.join(__dirname, '../prisma/migrations/20251213072000_sync_db_state/migration.sql');
        console.log(`📖 Reading migration file: ${migrationPath}`);

        // Read file as UTF-16LE as detected previously
        let sqlContent = fs.readFileSync(migrationPath, 'utf16le');

        // Remove Byte Order Mark (BOM) if present
        if (sqlContent.charCodeAt(0) === 0xFEFF) {
            console.log('✨ stripping BOM');
            sqlContent = sqlContent.slice(1);
        }

        console.log('📝 SQL Content loaded. Length:', sqlContent.length);

        // Split content by semicolon to handle statements individually
        const statements = sqlContent.split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0);

        console.log(`🚀 Executing ${statements.length} statements...`);

        for (const [index, sql] of statements.entries()) {
            try {
                // Ensure we don't print huge SQL blobs
                const preview = sql.substring(0, 50).replace(/\n/g, ' ') + '...';
                process.stdout.write(`   [${index + 1}/${statements.length}] ${preview} `);

                await client.query(sql);
                console.log('✅');
            } catch (error) {
                // 42710 = duplicate_object (e.g. enum exists)
                // 42P07 = duplicate_table (e.g. table exists)
                if (error.code === '42710' || error.code === '42P07') {
                    console.log('⚠️  Exists (Skipped)');
                } else {
                    console.log('❌ Failed');
                    console.error('   Error:', error.message);
                    // We continue even on error to try applying the rest
                }
            }
        }


        console.log('✅ SQL Execution Loop Completed!');

        console.log('🔧 Repairing duplicate "Supplier" columns...');
        const supplierSql = `
            ALTER TABLE "Supplier" ADD COLUMN IF NOT EXISTS "address" TEXT;
            ALTER TABLE "Supplier" ADD COLUMN IF NOT EXISTS "city" TEXT;
            ALTER TABLE "Supplier" ADD COLUMN IF NOT EXISTS "notes" TEXT;
            ALTER TABLE "Supplier" ADD COLUMN IF NOT EXISTS "taxId" TEXT;
        `;

        const supplierStmts = supplierSql.split(';').map(s => s.trim()).filter(s => s.length > 0);
        for (const sql of supplierStmts) {
            try {
                process.stdout.write(`   Applying Supplier fix... `);
                await client.query(sql);
                console.log('✅');
            } catch (e) {
                console.log('❌ ' + e.message);
            }
        }

    } catch (error) {
        console.error('❌ Error executing repair:', error);
        if (error.position) {
            console.error('   at position:', error.position);
        }
    } finally {
        await client.end();
    }
}

repairSchema();
