import 'dotenv/config';

console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'DEFINED' : 'UNDEFINED');
console.log('First 30 chars:', process.env.DATABASE_URL?.substring(0, 30));
