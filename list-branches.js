
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const branches = await prisma.branch.findMany({
        select: {
            id: true,
            name: true,
            code: true,
            status: true,
        },
    });

    console.log('Branches found:');
    branches.forEach((b) => {
        console.log(`- [${b.code}] ${b.name} (ID: ${b.id}, Status: ${b.status})`);
    });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
