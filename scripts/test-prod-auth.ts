
import { Client } from 'pg';

async function test(url: string, name: string) {
    console.log(`\nTesting ${name}...`);
    // console.log(`URL: ${url}`); // Masking for logs
    const client = new Client({ connectionString: url, connectionTimeoutMillis: 10000 });
    try {
        await client.connect();
        const res = await client.query('SELECT current_database(), inet_server_addr()');
        console.log(`✅ ${name} Success! Connected to: ${res.rows[0].current_database} at ${res.rows[0].inet_server_addr}`);
        await client.end();
    } catch (err: any) {
        console.error(`❌ ${name} Failed:`, err.message);
        if (err.cause) console.error('Cause:', err.cause);
    }
}

const pooled = 'postgresql://neondb_owner:npg_vhuqV32wAlIp@ep-floral-silence-a1jm7mgz-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
// Try unpooled with and without channel_binding just in case
const unpooled1 = 'postgresql://neondb_owner:npg_vhuqV32wAlIp@ep-floral-silence-a1jm7mgz.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const unpooled2 = 'postgresql://neondb_owner:npg_vhuqV32wAlIp@ep-floral-silence-a1jm7mgz.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';

async function run() {
    await test(pooled, 'Pooled');
    await test(unpooled1, 'Unpooled (Direct + ChannelBinding)');
    await test(unpooled2, 'Unpooled (Direct - NoChannelBinding)');
}

run();
