import { inventoryAdjustmentService } from './services/inventory-adjustment.service';

async function main() {
    try {
        console.log('Testing inventoryAdjustmentService.findAll...');
        const result = await inventoryAdjustmentService.findAll({
            page: 1,
            limit: 10,
        });
        console.log('Success!', result);
    } catch (error) {
        console.error('Service error:', error);
    }
}

main();
