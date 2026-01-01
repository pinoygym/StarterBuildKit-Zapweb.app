const { Client } = require('pg');

const PROD_URL = 'postgresql://neondb_owner:npg_vhuqV32wAlIp@ep-floral-silence-a1jm7mgz-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

async function checkTables() {
    console.log('🔍 Checking ALL tables in Production...');
    const client = new Client({ connectionString: PROD_URL });
    await client.connect();

    try {
        const res = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'Supplier'
            ORDER BY column_name;
        `);

        console.log('Found Supplier columns:');
        res.rows.forEach(r => console.log(`${r.column_name} (${r.data_type})`));

        const required = ['address', 'city', 'notes', 'taxId'];
        const found = res.rows.map(r => r.column_name);

        const missing = required.filter(c => !found.includes(c));

        if (missing.length === 0) {
            console.log('\n✅ All required Supplier columns FOUND.');
        } else {
            console.log('\n❌ MISSING Supplier columns:', missing.join(', '));
        }

    } catch (e) {
        console.error(e);
    } finally {
        client.end();
    }
}

checkTables();
