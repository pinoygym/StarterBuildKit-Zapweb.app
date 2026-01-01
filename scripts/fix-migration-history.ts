import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const migrationName = '20251208025806_add_service_report_system';
    console.log(`Deleting migration record: ${migrationName}`);
    const result = await prisma.$executeRawUnsafe(
        `DELETE FROM "_prisma_migrations" WHERE "migration_name" = '${migrationName}'`
    );
    console.log(`Deleted ${result} record(s).`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
