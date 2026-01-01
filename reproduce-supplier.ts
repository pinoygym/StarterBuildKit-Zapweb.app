
import { prisma } from './lib/prisma';
import { createTestSupplier } from './tests/helpers/api-test-utils';

async function main() {
    try {
        console.log('Creating supplier...');
        const data = createTestSupplier();
        console.log('Data:', JSON.stringify(data, null, 2));
        const supplier = await prisma.supplier.create({
            data,
        });
        console.log('Supplier created:', supplier.id);
    } catch (error) {
        console.error('Error creating supplier:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
