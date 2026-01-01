
import { Client } from 'pg';

const DB_SPRING_POND = 'postgresql://neondb_owner:npg_vhuqV32wAlIp@ep-spring-pond-a1stve3k-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const DB_BROAD_DARKNESS = 'postgresql://neondb_owner:npg_Bok87uEFzrxO@ep-broad-darkness-a1hfk92l.ap-southeast-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require';
// Production URL from comments
const DB_FLORAL_SILENCE = 'postgresql://neondb_owner:npg_vhuqV32wAlIp@ep-floral-silence-a1jm7mgz-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

async function checkDb(name: string, connectionString: string) {
    console.log(`\nChecking database: ${name}`);
    const client = new Client({ connectionString });
    try {
        await client.connect();
        const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'Supplier' AND column_name = 'taxId';
    `);

        if (res.rows.length > 0) {
            console.log(`[PASS] 'taxId' column exists in 'Supplier'.`);
        } else {
            console.error(`[FAIL] 'taxId' column MISSING in 'Supplier'.`);
        }
    } catch (err: any) {
        console.error(`[ERROR] Connection/Query failed: ${err.message}`);
        if (err.message.includes('password')) {
            console.error('Password authentication failed. Credentials might mismatch for this host.');
        }
    } finally {
        await client.end();
    }
}

async function main() {
    await checkDb('Spring Pond (Dev??)', DB_SPRING_POND);
    await checkDb('Broad Darkness (Unpooled??)', DB_BROAD_DARKNESS);
    await checkDb('Floral Silence (Production??)', DB_FLORAL_SILENCE);
}

main();
