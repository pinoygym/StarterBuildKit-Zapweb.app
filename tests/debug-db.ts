
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const categories = await prisma.productCategory.findMany({
            orderBy: { name: 'asc' },
        });
        console.log('Successfully fetched ' + categories.length + ' categories.');
        console.log(categories);
    } catch (e) {
        console.error('Database Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
