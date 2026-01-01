import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Clearing ReceivingVoucherItem data...');

    // Delete all receiving voucher items first
    await prisma.receivingVoucherItem.deleteMany({});
    console.log('✓ Cleared ReceivingVoucherItem');

    // Delete all receiving vouchers
    await prisma.receivingVoucher.deleteMany({});
    console.log('✓ Cleared ReceivingVoucher');

    console.log('\nNow run: npx prisma migrate deploy');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
