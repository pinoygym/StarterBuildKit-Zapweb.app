const { Client } = require('pg');

// Connection string for Neon database without channel_binding
const connectionString = 'postgresql://neondb_owner:npg_mBh8RKAr9Nei@ep-blue-mouse-a128nyc9-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';

async function testConnection() {
  const client = new Client({
    connectionString,
    connectionTimeoutMillis: 5000, // 5 second timeout
  });

  try {
    console.log('🔄 Attempting to connect to Neon database...');
    await client.connect();
    console.log('✅ Successfully connected to Neon database!');
    
    // Run a simple query to verify
    const res = await client.query('SELECT version()');
    console.log('📊 Database version:', res.rows[0].version);
    
    await client.end();
    console.log('🔒 Connection closed.');
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    console.log('\n📝 Troubleshooting steps:');
    console.log('1. Check if your Neon database is paused - visit https://console.neon.tech/');
    console.log('2. Verify your connection string is correct');
    console.log('3. Check your internet connection');
    console.log('4. Ensure your IP is allowed to connect to the database');
  }
}

// Add a timeout to the entire operation
Promise.race([
  testConnection(),
  new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Connection timeout after 10 seconds')), 10000)
  )
]).catch(err => {
  console.error('❌ Operation failed:', err.message);
});