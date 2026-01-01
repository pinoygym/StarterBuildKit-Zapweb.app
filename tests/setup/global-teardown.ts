import { disconnectDatabase } from '../helpers/db-cleanup';

/**
 * Global teardown runs once after all tests
 * Cleans up database connections
 */
export default async function globalTeardown() {
    console.log('\n🧹 Cleaning up test environment...\n');

    try {
        // Close database connections
        await disconnectDatabase();
        console.log('✓ Database connections closed');

        console.log('\n✅ Cleanup complete!\n');
    } catch (error) {
        console.error('\n❌ Error during cleanup:', error);
        // Don't throw - we want tests to exit even if cleanup fails
    }
}
