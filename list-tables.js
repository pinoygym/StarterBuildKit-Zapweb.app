const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://neondb_owner:npg_mBh8RKAr9Nei@ep-blue-mouse-a128nyc9-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
});

async function listTables() {
  try {
    await client.connect();
    const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    console.log(res.rows.map(row => row.table_name).join('\n'));
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

listTables();