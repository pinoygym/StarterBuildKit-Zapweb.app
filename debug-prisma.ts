
import { prisma } from './lib/prisma';

async function main() {
    console.log('Prisma keys:', Object.keys(prisma));
    console.log('Has supplier:', 'supplier' in prisma);
    console.log('Has receivingVoucherItem:', 'receivingVoucherItem' in prisma);
    console.log('Has ReceivingVoucherItem:', 'ReceivingVoucherItem' in prisma);
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
