require('dotenv').config();
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'FOUND' : 'MISSING');
console.log('URL length:', process.env.DATABASE_URL ? process.env.DATABASE_URL.length : 0);
