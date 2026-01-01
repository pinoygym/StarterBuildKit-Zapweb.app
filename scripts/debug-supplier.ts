
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { supplierRepository } from '../repositories/supplier.repository';
import { prisma } from '../lib/prisma';

async function main() {
    try {
        console.log('Testing SupplierRepository.findAll()...');
        const suppliers = await supplierRepository.findAll();
        console.log('Successfully fetched suppliers:', suppliers);

        console.log('Testing SupplierRepository.create()...');
        const newSupplier = await supplierRepository.create({
            companyName: `Test Supplier ${Date.now()}`,
            contactPerson: 'Test Person',
            phone: '1234567890',
            paymentTerms: 'COD',
            status: 'active'
        });
        console.log('Successfully created supplier:', newSupplier);

        // Cleanup
        await supplierRepository.delete(newSupplier.id);
        console.log('Successfully deleted test supplier');

    } catch (error) {
        console.error('Error in supplier operations:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
