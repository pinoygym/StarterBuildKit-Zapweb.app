
import { customerService } from '../services/customer.service';
import { prisma } from '../lib/prisma';

async function main() {
    const timestamp = Date.now();
    const newCustomer = {
        companyName: `Integration Test Co No Email ${timestamp}`,
        contactPerson: 'John No Email',
        phone: '09171111111',
        email: '',
        paymentTerms: 'Net 30' as any,
        customerType: 'regular' as any,
        creditLimit: 10000,
    };

    console.log('Attempting to create customer:', newCustomer);

    try {
        const result = await customerService.createCustomer(newCustomer);
        console.log('Success:', result);
    } catch (error: any) {
        console.error('Error creating customer:', error);
        if (error.fields) {
            console.error('Validation errors:', error.fields);
        }
    } finally {
        await prisma.$disconnect();
    }
}

main();
