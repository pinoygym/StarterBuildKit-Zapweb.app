import { prisma } from '@/lib/prisma';

async function debugTransfers() {
    console.log('=== Direct Database Query ===');
    const dbTransfers = await prisma.inventoryTransfer.findMany({
        include: {
            Branch: true,
            sourceWarehouse: true,
            destinationWarehouse: true
        }
    });
    console.log(`Found ${dbTransfers.length} transfers in database:`);
    dbTransfers.forEach(t => {
        console.log(`  - ${t.transferNumber} (Branch: ${t.Branch.name}, Status: ${t.status})`);
    });

    console.log('\n=== Repository Query (no filters) ===');
    const { inventoryTransferRepository } = await import('@/repositories/inventory-transfer.repository');
    const repoTransfers = await inventoryTransferRepository.findAll({});
    console.log(`Found ${repoTransfers.length} transfers via repository:`);
    repoTransfers.forEach((t: any) => {
        console.log(`  - ${t.transferNumber} (Branch: ${t.Branch.name}, Status: ${t.status})`);
    });

    console.log('\n=== Service Query (no filters) ===');
    const { inventoryTransferService } = await import('@/services/inventory-transfer.service');
    const serviceResult = await inventoryTransferService.findAll({});
    console.log(`Found ${serviceResult.data.length} transfers via service:`);
    serviceResult.data.forEach((t: any) => {
        console.log(`  - ${t.transferNumber} (Branch: ${t.Branch.name}, Status: ${t.status})`);
    });
}

debugTransfers().catch(console.error).finally(() => process.exit(0));
