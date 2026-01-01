import { config } from 'dotenv';
import { resolve } from 'path';
import { execSync } from 'child_process';
import { resetDatabase } from '../helpers/db-cleanup';

/**
 * Global setup runs once before all tests
 * Sets up test database and runs migrations
 */
export default async function globalSetup() {
    console.log('\n🔧 Setting up test environment...\n');

    // Load test environment variables
    const envPath = resolve(process.cwd(), '.env.test');
    config({ path: envPath });

    console.log('📝 Test database:', process.env.DATABASE_URL?.split('@')[1]?.split('?')[0]);

    try {
        // Push schema to test database (faster than migrations for tests)
        console.log('\n📦 Pushing database schema...');
        execSync('bunx prisma db push --accept-data-loss --skip-generate', {
            stdio: 'inherit',
            env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
        });
        console.log('✓ Schema pushed');

        // Generate Prisma client
        console.log('\n🔨 Generating Prisma client...');
        execSync('bunx prisma generate', {
            stdio: 'inherit',
        });
        console.log('✓ Prisma client generated');

        // Reset and seed database
        console.log('\n🌱 Resetting test database...');
        await resetDatabase();
        console.log('✓ Database ready');

        console.log('\n✅ Test environment ready!\n');
    } catch (error) {
        console.error('\n❌ Error setting up test environment:', error);
        throw error;
    }
}
