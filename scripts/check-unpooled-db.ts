import { Pool } from 'pg';

const UNPOOLED_URL = 'postgresql://neondb_owner:npg_Bok87uEFzrxO@ep-broad-darkness-a1hfk92l.ap-southeast-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require';

async function checkDatabase() {
    console.log('🔍 Checking Database: ep-broad-darkness-a1hfk92l');
    console.log('');

    const pool = new Pool({ connectionString: UNPOOLED_URL });

    try {
        const client = await pool.connect();
        console.log('✅ Connection successful!');
        console.log('');

        // Get database info
        const result = await client.query(`
            SELECT 
                current_database() as database,
                current_user as user,
                version() as version
        `);

        console.log('Database Info:');
        console.log(`  Database: ${result.rows[0].database}`);
        console.log(`  User: ${result.rows[0].user}`);
        console.log('');

        // Check if tables exist
        const tablesResult = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        `);

        console.log(`📊 Tables found: ${tablesResult.rows.length}`);
        if (tablesResult.rows.length > 0) {
            console.log('');
            console.log('Tables:');
            tablesResult.rows.forEach(row => {
                console.log(`  - ${row.table_name}`);
            });
        }

        client.release();
        await pool.end();

        console.log('');
        console.log('✅ Database exists and is accessible in your Neon account');

    } catch (error) {
        console.error('❌ Connection failed!');
        console.error('');
        console.error('Error:', error.message);
        console.error('');
        console.log('This database endpoint does NOT exist in your Neon account or credentials are invalid.');
        await pool.end();
        process.exit(1);
    }
}

checkDatabase();
