
import { salesOrderSchema } from '@/lib/validations/sales-order.validation';

const input = {
    customerName: 'John Doe',
    customerPhone: '09171234567',
    deliveryAddress: '123 Main St',
    warehouseId: 'clp123456789012345678901234',
    branchId: 'clp123456789012345678901234',
    deliveryDate: new Date(),
    orderNumber: 'SO-20231214-0001', // Simulation of generated order number
    items: [
        {
            productId: 'clp123456789012345678901234',
            quantity: 5,
            uom: 'Bottle',
            unitPrice: 100,
            subtotal: 500
        },
    ],
};

console.log('Validating input...');
const result = salesOrderSchema.safeParse(input);

if (result.success) {
    console.log('Validation SUCCESS!');
} else {
    console.log('Validation FAILED!');
    console.log(JSON.stringify(result.error.flatten().fieldErrors, null, 2));
}
