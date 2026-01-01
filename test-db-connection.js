// Test database connection
const { Client } = require('pg');

const connectionString = process.env.DATABASE_URL ||
  'postgresql://neondb_owner:npg_mBh8RKAr9Nei@ep-blue-mouse-a128nyc9-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';

async function testConnection() {
  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔄 Attempting to connect to database...');
    await client.connect();
    console.log('✅ Database connection successful!');

    const res = await client.query('SELECT NOW()');
    console.log('⏰ Server time:', res.rows[0].now);

    await client.end();
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    console.log('\n📝 Troubleshooting steps:');
    console.log('1. Check if your Neon database is paused - visit https://console.neon.tech/');
    console.log('2. Verify your DATABASE_URL in .env is correct');
    console.log('3. Check your internet connection');
    process.exit(1);
  }
}

testConnection();
