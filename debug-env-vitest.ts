import dotenv from 'dotenv';
dotenv.config({ path: '.env.test' });
console.log('JWT_SECRET:', process.env.JWT_SECRET);
console.log('JWT_SECRET Length:', process.env.JWT_SECRET?.length);
console.log('DATABASE_URL:', process.env.DATABASE_URL?.substring(0, 20) + '...');
